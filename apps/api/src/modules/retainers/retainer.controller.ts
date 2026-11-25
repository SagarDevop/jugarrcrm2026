import { Request, Response, NextFunction } from 'express';
import { RetainerModel } from '../../models/retainer.model';
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

      // Compute next period preserving anchorDay
      const nextStart = new Date(retainer.currentPeriod.endDate);
      const { end: nextEnd } = calculateAnchorPeriod(nextStart, retainer.anchorDateDay);

      retainer.currentPeriod = {
        periodNumber: retainer.currentPeriod.periodNumber + 1,
        startDate: nextStart,
        endDate: nextEnd,
        monthlyFee: retainer.monthlyFee,
        billingStatus: 'Pending',
        tokenAmount: 0,
        pendingBalance: retainer.monthlyFee,
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

      const populated = await RetainerModel.findById(retainer._id)
        .populate('clientId', 'clientName businessName email phone')
        .populate('assignedTeam', 'name email avatar');

      emitOrgEvent(user.organizationId, 'retainer:updated', populated);

      return ApiResponse.success(
        res,
        populated,
        `Retainer renewed for period #${retainer.currentPeriod.periodNumber} without date drift`
      );
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
