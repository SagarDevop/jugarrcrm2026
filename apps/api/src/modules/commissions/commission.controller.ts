import { Request, Response, NextFunction } from 'express';
import { CommissionModel } from '../../models/commission.model';
import { ApiResponse } from '../../utils/apiResponse';
import { USER_ROLES } from '@agencyos/shared';

export class CommissionController {
  static async listCommissions(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const filter: any = { organizationId: user.organizationId };

      if (user.role === USER_ROLES.SALES_MEMBER) {
        filter.salesMemberId = user._id;
      } else if (req.query.salesMemberId) {
        filter.salesMemberId = req.query.salesMemberId;
      }

      const commissions = await CommissionModel.find(filter)
        .populate('salesMemberId', 'name email avatar')
        .populate('clientId', 'clientName businessName')
        .populate('paymentId', 'amount paymentDate transactionReference')
        .sort({ createdAt: -1 });

      return ApiResponse.success(res, commissions);
    } catch (error) {
      next(error);
    }
  }
}
