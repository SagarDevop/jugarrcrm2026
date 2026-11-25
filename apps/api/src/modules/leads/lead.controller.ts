import { Request, Response, NextFunction } from 'express';
import { LeadModel } from '../../models/lead.model';
import { ClientModel } from '../../models/client.model';
import { ActivityEventModel } from '../../models/activityEvent.model';
import { NotificationModel } from '../../models/notification.model';
import { ApiResponse } from '../../utils/apiResponse';
import { AppError } from '../../utils/appError';
import { emitOrgEvent } from '../../sockets';
import { logAudit } from '../../middleware/audit.middleware';
import { USER_ROLES, PERMISSIONS } from '@agencyos/shared';

export class LeadController {
  static async listLeads(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const filter: any = { organizationId: user.organizationId };

      // Record-level permission check: if not admin and lacks leads.view_all, see assigned or created
      const canViewAll = user.role === USER_ROLES.SUPER_ADMIN || user.permissions.includes(PERMISSIONS.LEADS_VIEW_ALL);
      if (!canViewAll) {
        filter.$or = [{ assignedTo: user._id }, { createdBy: user._id }];
      }

      if (req.query.status) {
        filter.status = req.query.status;
      }
      if (req.query.search) {
        const regex = new RegExp(String(req.query.search), 'i');
        filter.$or = [
          { businessName: regex },
          { contactPerson: regex },
          { phone: regex },
          { email: regex },
        ];
      }

      const leads = await LeadModel.find(filter)
        .populate('assignedTo', 'name email avatar')
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 });

      return ApiResponse.success(res, leads);
    } catch (error) {
      next(error);
    }
  }

  static async createLead(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const data = req.body;

      // Duplicate detection within the organization
      const duplicate = await LeadModel.findOne({
        organizationId: user.organizationId,
        $or: [{ phone: data.phone }, { email: data.email.toLowerCase() }],
      });

      if (duplicate) {
        throw new AppError(
          `A lead with this phone (${data.phone}) or email (${data.email}) already exists.`,
          409
        );
      }

      const lead = await LeadModel.create({
        ...data,
        organizationId: user.organizationId,
        email: data.email.toLowerCase(),
        createdBy: user._id,
        assignedTo: data.assignedTo || user._id,
      });

      const populatedLead = await LeadModel.findById(lead._id)
        .populate('assignedTo', 'name email avatar')
        .populate('createdBy', 'name email');

      // Activity Event
      await ActivityEventModel.create({
        organizationId: user.organizationId,
        entityType: 'lead',
        entityId: lead._id.toString(),
        title: 'Lead Created',
        description: `Lead created for ${lead.businessName} (${lead.contactPerson})`,
        performedBy: user._id,
      });

      // Notification to Super Admin
      await NotificationModel.create({
        organizationId: user.organizationId,
        recipientId: user._id,
        title: 'New Lead Added',
        message: `${user.name} added lead: ${lead.businessName}`,
        type: 'lead',
        link: `/sales/leads`,
      });

      emitOrgEvent(user.organizationId, 'lead:created', populatedLead);

      return ApiResponse.success(res, populatedLead, 'Lead created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  static async getLeadById(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const lead = await LeadModel.findOne({
        _id: req.params.id,
        organizationId: user.organizationId,
      })
        .populate('assignedTo', 'name email avatar')
        .populate('createdBy', 'name email');

      if (!lead) throw new AppError('Lead not found.', 404);

      const canViewAll = user.role === USER_ROLES.SUPER_ADMIN || user.permissions.includes(PERMISSIONS.LEADS_VIEW_ALL);
      if (!canViewAll && lead.assignedTo?._id.toString() !== user._id && lead.createdBy?._id.toString() !== user._id) {
        throw new AppError('Unauthorized access to this lead record.', 403);
      }

      const activities = await ActivityEventModel.find({
        organizationId: user.organizationId,
        entityType: 'lead',
        entityId: lead._id.toString(),
      })
        .populate('performedBy', 'name email')
        .sort({ createdAt: -1 });

      return ApiResponse.success(res, { lead, activities });
    } catch (error) {
      next(error);
    }
  }

  static async updateLead(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const lead = await LeadModel.findOne({
        _id: req.params.id,
        organizationId: user.organizationId,
      });

      if (!lead) throw new AppError('Lead not found.', 404);

      const oldStatus = lead.status;
      Object.assign(lead, req.body);
      await lead.save();

      const populated = await LeadModel.findById(lead._id)
        .populate('assignedTo', 'name email avatar')
        .populate('createdBy', 'name email');

      if (req.body.status && req.body.status !== oldStatus) {
        await ActivityEventModel.create({
          organizationId: user.organizationId,
          entityType: 'lead',
          entityId: lead._id.toString(),
          title: 'Lead Stage Changed',
          description: `Stage changed from ${oldStatus} to ${req.body.status}`,
          performedBy: user._id,
        });
      }

      emitOrgEvent(user.organizationId, 'lead:updated', populated);

      return ApiResponse.success(res, populated, 'Lead updated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async convertLead(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const { id } = req.params;
      const { totalContractAmount, initialToken, advancePayment, paymentTerms } = req.body;

      const lead = await LeadModel.findOne({ _id: id, organizationId: user.organizationId });
      if (!lead) throw new AppError('Lead not found.', 404);

      if (lead.convertedClientId) {
        throw new AppError('This lead has already been converted into a client.', 400);
      }

      const contractAmount = Number(totalContractAmount || lead.estimatedBudget || 0);
      const token = Number(initialToken || 0);
      const advance = Number(advancePayment || 0);
      const remainingBalance = Math.max(0, contractAmount - (token + advance));

      const client = await ClientModel.create({
        organizationId: user.organizationId,
        clientName: lead.contactPerson,
        businessName: lead.businessName,
        phone: lead.phone,
        email: lead.email,
        city: lead.city,
        industry: lead.industry,
        website: lead.website,
        instagramUrl: lead.instagramProfile,
        serviceCategory: lead.interestedService,
        totalContractAmount: contractAmount,
        initialToken: token,
        advancePayment: advance,
        remainingBalance,
        paymentTerms: paymentTerms || 'Standard',
        assignedSalesMember: lead.assignedTo || user._id,
        status: 'Active',
        priority: lead.leadPriority,
        clientSource: lead.leadSource || 'Lead Conversion',
        leadReference: lead._id.toString(),
        createdBy: user._id,
      });

      lead.status = 'Converted';
      lead.convertedClientId = client._id as any;
      await lead.save();

      await ActivityEventModel.create({
        organizationId: user.organizationId,
        entityType: 'lead',
        entityId: lead._id.toString(),
        title: 'Lead Converted to Client',
        description: `Lead successfully converted to Client #${client._id}`,
        performedBy: user._id,
      });

      emitOrgEvent(user.organizationId, 'client:created', client);
      emitOrgEvent(user.organizationId, 'lead:updated', lead);

      return ApiResponse.success(
        res,
        { client, lead },
        'Lead converted to client successfully',
        201
      );
    } catch (error) {
      next(error);
    }
  }
}
