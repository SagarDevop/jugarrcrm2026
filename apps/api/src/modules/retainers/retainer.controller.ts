import { Request, Response, NextFunction } from 'express';
import { RetainerModel } from '../../models/retainer.model';
import { ClientModel } from '../../models/client.model';
import { PaymentModel } from '../../models/payment.model';
import { ApiResponse } from '../../utils/apiResponse';
import { AppError } from '../../utils/appError';
import { emitOrgEvent } from '../../sockets';

/**
 * Calculates the next anchor date without cumulative date drift.
 * Safely handles month-end limits (e.g. 31st vs 30/28 days).
 */
export const calculateAnchorPeriod = (startDate: Date, anchorDay: number): { start: Date; end: Date } => {
  const start = new Date(startDate);
  const end = new Date(start);

  // Set day to 1st first to prevent JS Date overflow when target month has fewer days
  end.setDate(1);
  const targetMonth = start.getMonth() + 1;
  end.setMonth(targetMonth);

  // Fix day according to original anchorDay, bounded by days in the target month
  const daysInMonth = new Date(end.getFullYear(), end.getMonth() + 1, 0).getDate();
  end.setDate(Math.min(anchorDay, daysInMonth));

  return { start, end };
};

export class RetainerController {
  static async listRetainers(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const filter: any = { organizationId: user.organizationId };

      if (req.query.clientId) filter.clientId = req.query.clientId;
      if (req.query.status) filter.status = req.query.status;

      const retainers = await RetainerModel.find(filter)
        .populate('clientId', 'clientName businessName email phone')
        .populate('assignedTeam', 'name email avatar')
        .sort({ createdAt: -1 });

      return ApiResponse.success(res, retainers);
    } catch (error) {
      next(error);
    }
  }

  static async createRetainer(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const { clientId, serviceName, packageDetails, monthlyFee, anchorDateDay, startDate, autoRenew, assignedTeam } = req.body;

      const start = new Date(startDate || Date.now());
      const anchorDay = anchorDateDay || start.getDate();
      const { end } = calculateAnchorPeriod(start, anchorDay);

      const currentPeriod = {
        periodNumber: 1,
        startDate: start,
        endDate: end,
        monthlyFee: Number(monthlyFee),
        billingStatus: 'Pending' as const,
        tokenAmount: 0,
        pendingBalance: Number(monthlyFee),
        deliverablesStatus: {
          reelsCompleted: 0,
          staticPostsCompleted: 0,
          graphicsCompleted: 0,
          storiesCompleted: 0,
          clientApproved: false,
        },
      };

      const retainer = await RetainerModel.create({
        organizationId: user.organizationId,
        clientId,
        serviceName,
        packageDetails,
        monthlyFee: Number(monthlyFee),
        anchorDateDay: anchorDay,
        currentPeriodStart: start,
        currentPeriodEnd: end,
        status: 'Active',
        autoRenew: autoRenew ?? true,
        assignedTeam: assignedTeam || [],
        currentPeriod,
        historyPeriods: [],
        createdBy: user._id,
      });

      const populated = await RetainerModel.findById(retainer._id)
        .populate('clientId', 'clientName businessName email phone')
        .populate('assignedTeam', 'name email avatar');

      emitOrgEvent(user.organizationId, 'retainer:created', populated);

      return ApiResponse.success(res, populated, 'Social media retainer created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  static async renewPeriod(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const { id } = req.params;

      const retainer = await RetainerModel.findOne({ _id: id, organizationId: user.organizationId });
      if (!retainer) throw new AppError('Retainer not found.', 404);

      // Archive current period without overwriting history
      const completedPeriod = {
        ...JSON.parse(JSON.stringify(retainer.currentPeriod)),
        archivedAt: new Date(),
      };
      retainer.historyPeriods.push(completedPeriod);

      // Compute next period preserving anchorDay or using provided dates
      const nextStart = req.body.startDate ? new Date(req.body.startDate) : new Date(retainer.currentPeriod.endDate);
      const nextEnd = req.body.endDate
        ? new Date(req.body.endDate)
        : calculateAnchorPeriod(nextStart, retainer.anchorDateDay).end;

      const fee = req.body.monthlyFee !== undefined ? Number(req.body.monthlyFee) : retainer.monthlyFee;
      const advance = Number(req.body.tokenAmount || 0);
      const pendingBalance = Math.max(0, fee - advance);

      retainer.currentPeriod = {
        periodNumber: retainer.currentPeriod.periodNumber + 1,
        startDate: nextStart,
        endDate: nextEnd,
        monthlyFee: fee,
        billingStatus: pendingBalance === 0 ? 'Paid' : advance > 0 ? 'Invoiced' : 'Pending',
        tokenAmount: advance,
        pendingBalance,
        deliverablesStatus: {
          reelsCompleted: 0,
          staticPostsCompleted: 0,
          graphicsCompleted: 0,
          storiesCompleted: 0,
          clientApproved: false,
        },
      } as any;

      retainer.currentPeriodStart = nextStart;
      retainer.currentPeriodEnd = nextEnd;

      await retainer.save();

      // If advance was provided for next period, record payment in PaymentModel
      if (advance > 0) {
        const validMethods = ['Bank Transfer', 'UPI', 'Credit Card', 'Cash', 'Stripe'];
        const safePaymentMethod = validMethods.includes(req.body.paymentMethod) ? req.body.paymentMethod : 'UPI';

        await PaymentModel.create({
          organizationId: user.organizationId,
          clientId: retainer.clientId,
          retainerId: retainer._id,
          amount: advance,
          category: 'Advance',
          paymentMethod: safePaymentMethod,
          transactionReference: `Period #${retainer.currentPeriod.periodNumber} Advance - ${req.body.notes || 'Retainer Advance'}`,
          paymentDate: req.body.paymentDate ? new Date(req.body.paymentDate) : new Date(),
          status: 'Verified',
          recordedBy: user._id,
          verifiedBy: user._id,
          verifiedAt: new Date(),
          notes: `Advance for Period #${retainer.currentPeriod.periodNumber} (${retainer.serviceName})`,
        });

        // Also update client remaining balance
        const client = await ClientModel.findById(retainer.clientId);
        if (client) {
          client.remainingBalance = Math.max(0, (client.remainingBalance || 0) - advance);
          await client.save();
        }
      }

      const populated = await RetainerModel.findById(retainer._id)
        .populate('clientId', 'clientName businessName email phone')
        .populate('assignedTeam', 'name email avatar');

      emitOrgEvent(user.organizationId, 'retainer:updated', populated);

      return ApiResponse.success(
        res,
        populated,
        `Retainer renewed for period #${retainer.currentPeriod.periodNumber}`
      );
    } catch (error) {
      next(error);
    }
  }

  static async recordPeriodPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const { id } = req.params;
      const { amount, periodNumber, paymentDate, paymentMethod = 'UPI', notes } = req.body;

      const payAmount = Number(amount);
      if (!payAmount || payAmount <= 0) {
        throw new AppError('Payment amount must be greater than zero.', 400);
      }

      const retainer = await RetainerModel.findOne({ _id: id, organizationId: user.organizationId });
      if (!retainer) throw new AppError('Retainer not found.', 404);

      const client = await ClientModel.findOne({ _id: retainer.clientId, organizationId: user.organizationId });
      if (!client) throw new AppError('Client not found.', 404);

      // Target period: if periodNumber provided and matches a history period, update that; otherwise currentPeriod
      let targetPeriod: any = retainer.currentPeriod;
      const pNum = Number(periodNumber);

      if (pNum && pNum !== retainer.currentPeriod.periodNumber) {
        const found = retainer.historyPeriods.find((p) => p.periodNumber === pNum);
        if (found) {
          targetPeriod = found;
        }
      }

      // Update target period's tokenAmount (paid amount) and pendingBalance
      const fee = targetPeriod.monthlyFee || retainer.monthlyFee;
      targetPeriod.monthlyFee = fee;
      targetPeriod.tokenAmount = (targetPeriod.tokenAmount || 0) + payAmount;
      targetPeriod.pendingBalance = Math.max(0, fee - targetPeriod.tokenAmount);
      targetPeriod.billingStatus = targetPeriod.pendingBalance === 0 ? 'Paid' : 'Invoiced';

      retainer.markModified('currentPeriod');
      retainer.markModified('historyPeriods');
      await retainer.save();

      // Update client balance safely
      client.remainingBalance = Math.max(0, (client.remainingBalance || 0) - payAmount);
      await client.save();

      // Create verified Payment record in PaymentModel so inflow, verified cash and ledger reflect it!
      const validMethods = ['Bank Transfer', 'UPI', 'Credit Card', 'Cash', 'Stripe'];
      const safePaymentMethod = validMethods.includes(paymentMethod) ? paymentMethod : 'UPI';

      const payment = await PaymentModel.create({
        organizationId: user.organizationId,
        clientId: client._id,
        retainerId: retainer._id,
        amount: payAmount,
        category: 'Retainer Monthly',
        paymentMethod: safePaymentMethod,
        transactionReference: `Period #${targetPeriod.periodNumber} - ${notes || 'Retainer Payment'}`,
        paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
        status: 'Verified',
        recordedBy: user._id,
        verifiedBy: user._id,
        verifiedAt: new Date(),
        notes: `Retainer Period #${targetPeriod.periodNumber} payment for ${retainer.serviceName}`,
      });

      emitOrgEvent(user.organizationId, 'payment:created', payment);
      emitOrgEvent(user.organizationId, 'retainer:updated', retainer);

      return ApiResponse.success(res, { retainer, payment }, 'Period payment recorded successfully');
    } catch (error) {
      next(error);
    }
  }

  static async updatePeriod(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const { id } = req.params;
      const { periodNumber, startDate, endDate, monthlyFee, tokenAmount, pendingBalance, billingStatus } = req.body;

      const retainer = await RetainerModel.findOne({ _id: id, organizationId: user.organizationId });
      if (!retainer) throw new AppError('Retainer not found.', 404);

      let targetPeriod: any = retainer.currentPeriod;
      const pNum = Number(periodNumber);
      if (pNum && pNum !== retainer.currentPeriod.periodNumber) {
        const found = retainer.historyPeriods.find((p) => p.periodNumber === pNum);
        if (found) targetPeriod = found;
      }

      if (startDate) targetPeriod.startDate = new Date(startDate);
      if (endDate) targetPeriod.endDate = new Date(endDate);
      if (monthlyFee !== undefined) targetPeriod.monthlyFee = Number(monthlyFee);
      if (tokenAmount !== undefined) targetPeriod.tokenAmount = Number(tokenAmount);
      if (pendingBalance !== undefined) {
        targetPeriod.pendingBalance = Number(pendingBalance);
      } else if (monthlyFee !== undefined || tokenAmount !== undefined) {
        targetPeriod.pendingBalance = Math.max(0, targetPeriod.monthlyFee - targetPeriod.tokenAmount);
      }
      if (billingStatus) targetPeriod.billingStatus = billingStatus;

      retainer.markModified('currentPeriod');
      retainer.markModified('historyPeriods');
      await retainer.save();

      emitOrgEvent(user.organizationId, 'retainer:updated', retainer);

      return ApiResponse.success(res, retainer, 'Period updated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async updateDeliverables(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const { id } = req.params;
      const { deliverablesStatus } = req.body;

      const retainer = await RetainerModel.findOne({ _id: id, organizationId: user.organizationId });
      if (!retainer) throw new AppError('Retainer not found.', 404);

      if (deliverablesStatus) {
        Object.assign(retainer.currentPeriod.deliverablesStatus, deliverablesStatus);
      }

      await retainer.save();
      emitOrgEvent(user.organizationId, 'retainer:updated', retainer);

      return ApiResponse.success(res, retainer, 'Deliverables updated successfully');
    } catch (error) {
      next(error);
    }
  }
}
