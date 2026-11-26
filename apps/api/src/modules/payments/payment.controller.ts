import { Request, Response, NextFunction } from 'express';
import { PaymentModel } from '../../models/payment.model';
import { ClientModel } from '../../models/client.model';
import { ProjectModel } from '../../models/project.model';
import { RetainerModel } from '../../models/retainer.model';
import { CommissionModel } from '../../models/commission.model';
import { UserModel } from '../../models/user.model';
import { ActivityEventModel } from '../../models/activityEvent.model';
import { NotificationModel } from '../../models/notification.model';
import { ApiResponse } from '../../utils/apiResponse';
import { AppError } from '../../utils/appError';
import { emitOrgEvent } from '../../sockets';
import { logAudit } from '../../middleware/audit.middleware';

export class PaymentController {
  static async listPayments(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const filter: any = { organizationId: user.organizationId };

      if (req.query.status) filter.status = req.query.status;
      if (req.query.clientId) filter.clientId = req.query.clientId;
      if (req.query.projectId) filter.projectId = req.query.projectId;

      const payments = await PaymentModel.find(filter)
        .populate('clientId', 'clientName businessName email phone')
        .populate('projectId', 'name')
        .populate('recordedBy', 'name email')
        .populate('verifiedBy', 'name email')
        .sort({ paymentDate: -1 });

      return ApiResponse.success(res, payments);
    } catch (error) {
      next(error);
    }
  }

  static async recordPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const data = req.body;

      const client = await ClientModel.findOne({ _id: data.clientId, organizationId: user.organizationId });
      if (!client) throw new AppError('Client not found.', 404);

      const payment = await PaymentModel.create({
        ...data,
        organizationId: user.organizationId,
        status: 'Pending', // All new payments start as pending verification
        recordedBy: user._id,
      });

      const populated = await PaymentModel.findById(payment._id)
        .populate('clientId', 'clientName businessName')
        .populate('recordedBy', 'name email');

      await ActivityEventModel.create({
        organizationId: user.organizationId,
        entityType: 'payment',
        entityId: payment._id.toString(),
        title: 'Payment Recorded (Pending)',
        description: `Payment of ${payment.amount} recorded for ${client.businessName}`,
        performedBy: user._id,
      });

      emitOrgEvent(user.organizationId, 'payment:created', populated);

      return ApiResponse.success(res, populated, 'Payment recorded successfully and submitted for verification', 201);
    } catch (error) {
      next(error);
    }
  }

  static async verifyPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const { id } = req.params;
      const { status, notes } = req.body;

      const payment = await PaymentModel.findOne({ _id: id, organizationId: user.organizationId });
      if (!payment) throw new AppError('Payment not found.', 404);

      const oldStatus = payment.status;
      payment.status = status;
      payment.verifiedBy = user._id as any;
      payment.verifiedAt = new Date();
      if (notes) payment.notes = notes;
      await payment.save();

      // If verified, update client & project balances and calculate commission
      if (status === 'Verified' && oldStatus !== 'Verified') {
        const client = await ClientModel.findOne({ _id: payment.clientId, organizationId: user.organizationId });
        if (client) {
          client.remainingBalance = Math.max(0, client.remainingBalance - payment.amount);
          await client.save();

          // Calculate commission for the assigned sales member
          if (client.assignedSalesMember) {
            const salesMember = await UserModel.findById(client.assignedSalesMember);
            if (salesMember) {
              const commissionRate = salesMember.commissionPercentage || 10;
              const commissionAmount = Math.round((payment.amount * commissionRate) / 100);

              // Unique index on paymentId in CommissionModel prevents duplicate calculations!
              await CommissionModel.findOneAndUpdate(
                { paymentId: payment._id },
                {
                  organizationId: user.organizationId,
                  salesMemberId: salesMember._id,
                  paymentId: payment._id,
                  clientId: client._id,
                  dealAmount: client.totalContractAmount,
                  verifiedPaymentAmount: payment.amount,
                  commissionRate,
                  commissionAmount,
                  status: 'Approved',
                  calculatedAt: new Date(),
                  approvedBy: user._id,
                  approvedAt: new Date(),
                },
                { upsert: true, new: true }
              );
            }
          }
        }

        if (payment.projectId) {
          const project = await ProjectModel.findOne({ _id: payment.projectId, organizationId: user.organizationId });
          if (project) {
            project.paidAmount += payment.amount;
            project.remainingAmount = Math.max(0, project.totalAmount - project.paidAmount);
            await project.save();
          }
        }
      }

      await logAudit({
        organizationId: user.organizationId,
        userId: user._id,
        userEmail: user.email,
        action: `PAYMENT_${status.toUpperCase()}`,
        entityType: 'Payment',
        entityId: payment._id.toString(),
        changes: { amount: payment.amount, status, notes },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      const populated = await PaymentModel.findById(payment._id)
        .populate('clientId', 'clientName businessName')
        .populate('verifiedBy', 'name email');

      emitOrgEvent(user.organizationId, 'payment:updated', populated);

      return ApiResponse.success(res, populated, `Payment status updated to ${status}`);
    } catch (error) {
      next(error);
    }
  }

  static async deletePayment(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const { id } = req.params;

      const payment = await PaymentModel.findOne({ _id: id, organizationId: user.organizationId });
      if (!payment) throw new AppError('Payment not found.', 404);

      // If the payment was Verified, revert balances
      if (payment.status === 'Verified') {
        // 1. Revert client remaining balance
        const client = await ClientModel.findOne({ _id: payment.clientId, organizationId: user.organizationId });
        if (client) {
          client.remainingBalance = (client.remainingBalance || 0) + payment.amount;
          await client.save();
        }

        // 2. Revert project balances if linked
        if (payment.projectId) {
          const project = await ProjectModel.findOne({ _id: payment.projectId, organizationId: user.organizationId });
          if (project) {
            project.paidAmount = Math.max(0, project.paidAmount - payment.amount);
            project.remainingAmount = Math.max(0, project.totalAmount - project.paidAmount);
            await project.save();
          }
        }

        // 3. Revert retainer balances if linked
        if (payment.retainerId) {
          const retainer = await RetainerModel.findOne({ _id: payment.retainerId, organizationId: user.organizationId });
          if (retainer) {
            if (retainer.currentPeriod) {
              retainer.currentPeriod.tokenAmount = Math.max(0, (retainer.currentPeriod.tokenAmount || 0) - payment.amount);
              retainer.currentPeriod.pendingBalance = Math.max(0, retainer.currentPeriod.monthlyFee - retainer.currentPeriod.tokenAmount);
              retainer.currentPeriod.billingStatus =
                retainer.currentPeriod.pendingBalance === 0
                  ? 'Paid'
                  : retainer.currentPeriod.tokenAmount > 0
                  ? 'Invoiced'
                  : 'Pending';
              retainer.markModified('currentPeriod');
            }
            await retainer.save();
          }
        }

        // 4. Delete commission record if calculated
        await CommissionModel.findOneAndDelete({ paymentId: payment._id });
      }

      // Delete payment record
      await PaymentModel.findByIdAndDelete(payment._id);

      await logAudit({
        organizationId: user.organizationId,
        userId: user._id,
        userEmail: user.email,
        action: 'PAYMENT_DELETED',
        entityType: 'Payment',
        entityId: payment._id.toString(),
        changes: { amount: payment.amount, client: payment.clientId, transactionReference: payment.transactionReference },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      emitOrgEvent(user.organizationId, 'payment:deleted', { _id: payment._id });

      return ApiResponse.success(res, { _id: payment._id }, 'Payment deleted successfully and balances reverted.');
    } catch (error) {
      next(error);
    }
  }
}
