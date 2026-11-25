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
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 })
        .lean();

      const allowFinance = canViewFinancials(user);
      const sanitizedClients = clients.map((c) => sanitizeClientForSales(c, allowFinance));

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

      const client = await ClientModel.create({
        ...data,
        organizationId: user.organizationId,
        email: data.email.toLowerCase(),
        totalContractAmount: totalContract,
        initialToken: token,
        advancePayment: advance,
        remainingBalance,
        assignedSalesMember: data.assignedSalesMember || user._id,
        createdBy: user._id,
      });

      const populatedClient = await ClientModel.findById(client._id)
        .populate('assignedSalesMember', 'name email avatar')
        .populate('assignedProjectManager', 'name email avatar')
        .populate('createdBy', 'name email');

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
        .populate('createdBy', 'name email')
        .lean();

      if (!client) throw new AppError('Client not found.', 404);

      const allowFinance = canViewFinancials(user);

      // Associated records
      const [projects, retainers, calls, followups, payments] = await Promise.all([
        ProjectModel.find({ clientId: client._id, organizationId: user.organizationId }),
        RetainerModel.find({ clientId: client._id, organizationId: user.organizationId }),
        CallModel.find({ clientId: client._id, organizationId: user.organizationId }).sort({ callDate: -1 }),
        FollowUpModel.find({ clientId: client._id, organizationId: user.organizationId }).sort({ dueDate: 1 }),
        allowFinance
          ? PaymentModel.find({ clientId: client._id, organizationId: user.organizationId }).sort({ paymentDate: -1 })
          : Promise.resolve([]),
      ]);

      const sanitizedClient = sanitizeClientForSales(client, allowFinance);

      return ApiResponse.success(res, {
        client: sanitizedClient,
        projects,
        retainers,
        calls,
        followups,
        payments,
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
