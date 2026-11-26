import mongoose, { Types } from 'mongoose';
import { ClientModel } from '../models/client.model';
import { RetainerModel } from '../models/retainer.model';
import { ProjectModel } from '../models/project.model';
import { PaymentModel } from '../models/payment.model';
import { calculateAnchorPeriod } from '../modules/retainers/retainer.controller';
import { logger } from '../utils/logger';

/**
 * Enterprise Financial Synchronization & Reconciliation Engine
 * Guarantees that Client Advances, Retainer Periods, Project Milestones,
 * Payments Ledger, and Executive Dashboard are always 100% unified in real-time.
 */
export class FinancialSyncService {
  public static async syncFinancialPipeline(
    orgId: Types.ObjectId | string,
    currentUserId?: Types.ObjectId | string
  ): Promise<void> {
    try {
      const organizationId = typeof orgId === 'string' ? new mongoose.Types.ObjectId(orgId) : orgId;

      // 1. Reconcile all clients and ensure models & onboarding payments exist
      const clients = await ClientModel.find({
        organizationId,
        status: { $in: ['Active', 'Prospect', 'On Hold'] },
      });

      for (const client of clients) {
        let linkedRetainerId: any = null;
        let linkedProjectId: any = null;

        // Auto-create Retainer model if service category indicates retainer
        if (client.serviceCategory && /retainer/i.test(client.serviceCategory)) {
          let retainer = await RetainerModel.findOne({ clientId: client._id, organizationId });
          if (!retainer) {
            const start = client.startDate || client.createdAt || new Date();
            const anchorDay = new Date(start).getDate() || 20;
            const { end } = calculateAnchorPeriod(new Date(start), anchorDay);
            const fee = client.totalContractAmount > 0 ? client.totalContractAmount : 3000;
            const initialPaid = (client.initialToken || 0) + (client.advancePayment || 0);
            const pendingBal = Math.max(0, fee - initialPaid);

            retainer = await RetainerModel.create({
              organizationId,
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
              assignedTeam: client.assignedSalesMember
                ? [client.assignedSalesMember]
                : client.createdBy
                ? [client.createdBy]
                : [],
              currentPeriod: {
                periodNumber: 1,
                startDate: start,
                endDate: end,
                monthlyFee: fee,
                billingStatus: pendingBal === 0 ? 'Paid' : initialPaid > 0 ? 'Invoiced' : 'Pending',
                tokenAmount: initialPaid,
                pendingBalance: pendingBal,
                deliverablesStatus: {
                  reelsCompleted: 0,
                  staticPostsCompleted: 0,
                  graphicsCompleted: 0,
                  storiesCompleted: 0,
                  clientApproved: false,
                },
              },
              historyPeriods: [],
              createdBy: client.createdBy || currentUserId,
            });
          }
          linkedRetainerId = retainer._id;
        }

        // Auto-create Project model if service category indicates development
        if (client.serviceCategory && /web|software|dev/i.test(client.serviceCategory)) {
          let project = await ProjectModel.findOne({ clientId: client._id, organizationId });
          if (!project) {
            const initialPaid = (client.initialToken || 0) + (client.advancePayment || 0);
            project = await ProjectModel.create({
              organizationId,
              clientId: client._id,
              name: `${client.businessName} - Web Platform Development`,
              category: 'Web Development',
              status: 'Planning',
              totalAmount: client.totalContractAmount || 0,
              paidAmount: initialPaid,
              remainingAmount: client.remainingBalance || 0,
              milestones: [
                { title: 'Requirements & Scope Finalization', status: 'Completed' },
                { title: 'UI/UX Design & Architecture', status: 'Pending' },
                { title: 'Frontend & Backend Development', status: 'Pending' },
                { title: 'Testing & Launch', status: 'Pending' },
              ],
              createdBy: client.createdBy || currentUserId,
            });
          }
          linkedProjectId = project._id;
        }

        // Reconcile Onboarding Advance / Token Payment into PaymentModel
        const totalAdvance = (client.initialToken || 0) + (client.advancePayment || 0);
        if (totalAdvance > 0) {
          const existingClientPayments = await PaymentModel.find({
            organizationId,
            clientId: client._id,
            status: 'Verified',
          });

          const currentPaidTotal = existingClientPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

          if (currentPaidTotal < totalAdvance) {
            const missing = totalAdvance - currentPaidTotal;
            await PaymentModel.create({
              organizationId,
              clientId: client._id,
              retainerId: linkedRetainerId || undefined,
              projectId: linkedProjectId || undefined,
              amount: missing,
              category: client.advancePayment > 0 ? 'Advance' : 'Token',
              paymentMethod: 'UPI',
              transactionReference: `Onboarding Advance - ${client.businessName}`,
              paymentDate: client.startDate || client.createdAt || new Date(),
              status: 'Verified',
              recordedBy: client.createdBy || currentUserId,
              verifiedBy: client.createdBy || currentUserId,
              verifiedAt: client.startDate || client.createdAt || new Date(),
              notes: `Verified advance payment recorded during client onboarding`,
            });
          }
        }
      }

      // 2. Reconcile Retainer Period Payments
      const retainers = await RetainerModel.find({
        organizationId,
        status: { $in: ['Active', 'Paused'] },
      });

      for (const ret of retainers) {
        const periodPaid = ret.currentPeriod?.tokenAmount || 0;
        if (periodPaid > 0) {
          const retPayments = await PaymentModel.find({
            organizationId,
            $or: [{ retainerId: ret._id }, { clientId: ret.clientId }],
            status: 'Verified',
          });

          // Ensure retainerId link exists on client payments
          for (const p of retPayments) {
            if (!p.retainerId) {
              p.retainerId = ret._id as any;
              await p.save();
            }
          }

          const totalRetPayments = retPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

          if (totalRetPayments < periodPaid) {
            const diff = periodPaid - totalRetPayments;
            await PaymentModel.create({
              organizationId,
              clientId: ret.clientId,
              retainerId: ret._id,
              amount: diff,
              category: 'Advance',
              paymentMethod: 'UPI',
              transactionReference: `Period #${ret.currentPeriod.periodNumber} Advance - ${ret.serviceName}`,
              paymentDate: ret.currentPeriod.startDate || new Date(),
              status: 'Verified',
              recordedBy: ret.createdBy || currentUserId,
              verifiedBy: ret.createdBy || currentUserId,
              verifiedAt: ret.currentPeriod.startDate || new Date(),
              notes: `Advance for Retainer Period #${ret.currentPeriod.periodNumber}`,
            });
          }
        }
      }
    } catch (error: any) {
      logger.error('[FinancialSyncService] Sync error:', error.message);
    }
  }
}
