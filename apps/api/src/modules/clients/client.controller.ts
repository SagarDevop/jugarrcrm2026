import { Request, Response, NextFunction } from 'express';
import { ClientModel } from '../../models/client.model';
import { ProjectModel } from '../../models/project.model';
import { RetainerModel } from '../../models/retainer.model';
import { PaymentModel } from '../../models/payment.model';
import { CallModel } from '../../models/call.model';
import { FollowUpModel } from '../../models/followup.model';
import { ActivityEventModel } from '../../models/activityEvent.model';
import { ApiResponse } from '../../utils/apiResponse';
import { AppError } from '../../utils/appError';
import { emitOrgEvent } from '../../sockets';
import { canViewFinancials } from '../../middleware/rbac.middleware';
import { USER_ROLES } from '@agencyos/shared';
import { calculateAnchorPeriod } from '../retainers/retainer.controller';

// Helper to check if a user is permitted to view payment slips and financials for a given client:
// Super Admin always can; Sales Members can ONLY if they created the client themselves.
export const checkCanViewClientFinancials = (user: any, clientCreatedBy: any): boolean => {
  if (!user) return false;
  if (user.role === USER_ROLES.SUPER_ADMIN) return true;
  if (!clientCreatedBy) return false;
  const createdById = clientCreatedBy._id ? clientCreatedBy._id.toString() : clientCreatedBy.toString();
  return createdById === user._id.toString();
};

// Helper to sanitize client record for sales users who lack finance permissions
export const sanitizeClientForSales = (clientObj: any, allowFinance: boolean) => {
  if (allowFinance) return clientObj;

  const sanitized = { ...clientObj };
  delete sanitized.totalContractAmount;
  delete sanitized.initialToken;
  delete sanitized.advancePayment;
  delete sanitized.remainingBalance;
  delete sanitized.customQuotation;
  delete sanitized.internalNotes;
  return sanitized;
};

export class ClientController {
  static async listClients(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const filter: any = { organizationId: user.organizationId };

      if (req.query.status) {
        filter.status = req.query.status;
      }
      if (req.query.search) {
        const regex = new RegExp(String(req.query.search), 'i');
        filter.$or = [
          { clientName: regex },
          { businessName: regex },
          { phone: regex },
          { email: regex },
        ];
      }

      const clients = await ClientModel.find(filter)
        .populate('assignedSalesMember', 'name email avatar')
        .populate('assignedProjectManager', 'name email avatar')
        .populate('createdBy', 'name email _id')
        .sort({ createdAt: -1 })
        .lean();

      const sanitizedClients = clients.map((c) => {
        const canView = checkCanViewClientFinancials(user, c.createdBy);
        return sanitizeClientForSales(c, canView);
      });

      return ApiResponse.success(res, sanitizedClients);
    } catch (error) {
      next(error);
    }
  }

  static async createClient(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const data = req.body;

      // Duplicate detection within the organization
      const duplicate = await ClientModel.findOne({
        organizationId: user.organizationId,
        $or: [{ phone: data.phone }, { email: data.email.toLowerCase() }],
      });

      if (duplicate) {
        throw new AppError(
          `A client with phone (${data.phone}) or email (${data.email}) already exists.`,
          409
        );
      }

      const totalContract = Number(data.totalContractAmount || 0);
      const token = Number(data.initialToken || 0);
      const advance = Number(data.advancePayment || 0);
      const remainingBalance = Math.max(0, totalContract - (token + advance));

      // Manual date for past or new clients
      const manualDate = data.startDate || data.createdAt;
      const parsedDate = manualDate ? new Date(manualDate) : new Date();

      const client = await ClientModel.create({
        ...data,
        organizationId: user.organizationId,
        email: data.email.toLowerCase(),
        totalContractAmount: totalContract,
        initialToken: token,
        advancePayment: advance,
        remainingBalance,
        assignedSalesMember: data.assignedSalesMember || user._id,
        startDate: parsedDate,
        createdAt: parsedDate,
        createdBy: user._id,
      });

      const populatedClient = await ClientModel.findById(client._id)
        .populate('assignedSalesMember', 'name email avatar')
        .populate('assignedProjectManager', 'name email avatar')
        .populate('createdBy', 'name email');

      const initialPaid = token + advance;
      let createdRetainer: any = null;
      let createdProject: any = null;

      // Auto-create Retainer contract if service category is Social Media Retainer
      if (client.serviceCategory && /retainer/i.test(client.serviceCategory)) {
        const start = new Date(parsedDate);
        const anchorDay = start.getDate() || 20;
        const { end } = calculateAnchorPeriod(start, anchorDay);
        const fee = totalContract > 0 ? totalContract : Number(data.customQuotation || 0);

        createdRetainer = await RetainerModel.create({
          organizationId: user.organizationId,
          clientId: client._id,
          serviceName: `${client.businessName} - Social Media Retainer`,
          packageDetails: {
            reelsCount: 15,
            staticPostsCount: 20,
            graphicDesignsCount: 10,
            storiesCount: 30,
            customDeliverables: [],
          },
          monthlyFee: fee,
          anchorDateDay: anchorDay,
          currentPeriodStart: start,
          currentPeriodEnd: end,
          status: 'Active',
          autoRenew: true,
          assignedTeam: [client.assignedSalesMember || user._id],
          currentPeriod: {
            periodNumber: 1,
            startDate: start,
            endDate: end,
            monthlyFee: fee,
            billingStatus: remainingBalance === 0 ? 'Paid' : initialPaid > 0 ? 'Invoiced' : 'Pending',
            tokenAmount: initialPaid,
            pendingBalance: remainingBalance,
            deliverablesStatus: {
              reelsCompleted: 0,
              staticPostsCompleted: 0,
              graphicsCompleted: 0,
              storiesCompleted: 0,
              clientApproved: false,
            },
          },
          historyPeriods: [],
          createdBy: user._id,
        });
      } else if (client.serviceCategory && /web|software|dev/i.test(client.serviceCategory)) {
        createdProject = await ProjectModel.create({
          organizationId: user.organizationId,
          clientId: client._id,
          name: `${client.businessName} - Web Platform Development`,
          category: 'Web Development',
          status: 'Planning',
          totalAmount: totalContract,
          paidAmount: initialPaid,
          remainingAmount: remainingBalance,
          milestones: [
            { title: 'Requirements & Scope Finalization', status: 'Completed' },
            { title: 'UI/UX Design & Architecture', status: 'Pending' },
            { title: 'Frontend & Backend Development', status: 'Pending' },
            { title: 'Testing & Launch', status: 'Pending' },
          ],
          createdBy: user._id,
        });
      }

      // If initial advance or token was paid, automatically record it in PaymentModel!
      if (initialPaid > 0) {
        const payment = await PaymentModel.create({
          organizationId: user.organizationId,
          clientId: client._id,
          retainerId: createdRetainer?._id,
          projectId: createdProject?._id,
          amount: initialPaid,
          category: advance > 0 ? 'Advance' : 'Token',
          paymentMethod: 'UPI',
          transactionReference: `Onboarding Advance - ${client.businessName}`,
          paymentDate: parsedDate,
          status: 'Verified',
          recordedBy: user._id,
          verifiedBy: user._id,
          verifiedAt: parsedDate,
          notes: `Advance payment recorded during client onboarding for ${client.businessName}`,
        });
        emitOrgEvent(user.organizationId, 'payment:created', payment);
      }

      await ActivityEventModel.create({
        organizationId: user.organizationId,
        entityType: 'client',
        entityId: client._id.toString(),
        title: 'Client Registered',
        description: `New client ${client.clientName} (${client.businessName}) registered by ${user.name}`,
        performedBy: user._id,
      });

      emitOrgEvent(user.organizationId, 'client:created', populatedClient);

      return ApiResponse.success(res, populatedClient, 'Client registered successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  static async getClientById(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const client = await ClientModel.findOne({
        _id: req.params.id,
        organizationId: user.organizationId,
      })
        .populate('assignedSalesMember', 'name email avatar phone')
        .populate('assignedProjectManager', 'name email avatar phone')
        .populate('createdBy', 'name email _id')
        .lean();

      if (!client) throw new AppError('Client not found.', 404);

      // Super Admin can view all payments & slips.
      // Sales members can ONLY view payments & slips for clients THEY created themselves.
      // For clients assigned by Admin, sales members only see client data & deliverables scope.
      const canViewThisClientPayments = checkCanViewClientFinancials(user, client.createdBy);

      // Associated records
      const [projects, retainers, calls, followups, payments] = await Promise.all([
        ProjectModel.find({ clientId: client._id, organizationId: user.organizationId }),
        RetainerModel.find({ clientId: client._id, organizationId: user.organizationId }),
        CallModel.find({ clientId: client._id, organizationId: user.organizationId }).sort({ callDate: -1 }),
        FollowUpModel.find({ clientId: client._id, organizationId: user.organizationId }).sort({ dueDate: 1 }),
        canViewThisClientPayments
          ? PaymentModel.find({ clientId: client._id, organizationId: user.organizationId }).sort({ paymentDate: -1 })
          : Promise.resolve([]),
      ]);

      const sanitizedClient = sanitizeClientForSales(client, canViewThisClientPayments);

      // Sanitize Retainers: If not permitted to view finances for this client,
      // hide fee and balance amounts while preserving deliverables scope (reels, posts, graphics, stories)
      const sanitizedRetainers = canViewThisClientPayments
        ? retainers
        : retainers.map((r: any) => {
            const ret = r.toObject ? r.toObject() : { ...r };
            delete ret.monthlyFee;
            if (ret.currentPeriod) {
              const cp = { ...ret.currentPeriod };
              delete cp.monthlyFee;
              delete cp.tokenAmount;
              delete cp.pendingBalance;
              ret.currentPeriod = cp;
            }
            if (ret.historyPeriods) {
              ret.historyPeriods = ret.historyPeriods.map((hp: any) => {
                const p = { ...hp };
                delete p.monthlyFee;
                delete p.tokenAmount;
                delete p.pendingBalance;
                return p;
              });
            }
            return ret;
          });

      // Sanitize Projects: Hide financial contract values if not permitted
      const sanitizedProjects = canViewThisClientPayments
        ? projects
        : projects.map((p: any) => {
            const proj = p.toObject ? p.toObject() : { ...p };
            delete proj.totalAmount;
            delete proj.paidAmount;
            delete proj.remainingAmount;
            return proj;
          });

      return ApiResponse.success(res, {
        client: sanitizedClient,
        projects: sanitizedProjects,
        retainers: sanitizedRetainers,
        calls,
        followups,
        payments,
        canViewPayments: canViewThisClientPayments,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateClient(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const client = await ClientModel.findOne({
        _id: req.params.id,
        organizationId: user.organizationId,
      });

      if (!client) throw new AppError('Client not found.', 404);

      // Recalculate remaining balance if financial figures are updated
      if (req.body.totalContractAmount !== undefined || req.body.initialToken !== undefined || req.body.advancePayment !== undefined) {
        const total = req.body.totalContractAmount !== undefined ? Number(req.body.totalContractAmount) : client.totalContractAmount;
        const token = req.body.initialToken !== undefined ? Number(req.body.initialToken) : client.initialToken;
        const advance = req.body.advancePayment !== undefined ? Number(req.body.advancePayment) : client.advancePayment;
        req.body.remainingBalance = Math.max(0, total - (token + advance));
      }

      Object.assign(client, req.body);

      if (req.body.startDate || req.body.createdAt) {
        const updatedDate = new Date(req.body.startDate || req.body.createdAt);
        client.startDate = updatedDate;
        client.createdAt = updatedDate;
      }

      await client.save();

      const populated = await ClientModel.findById(client._id)
        .populate('assignedSalesMember', 'name email avatar')
        .populate('assignedProjectManager', 'name email avatar')
        .populate('createdBy', 'name email');

      emitOrgEvent(user.organizationId, 'client:updated', populated);

      return ApiResponse.success(res, populated, 'Client updated successfully');
    } catch (error) {
      next(error);
    }
  }
}
