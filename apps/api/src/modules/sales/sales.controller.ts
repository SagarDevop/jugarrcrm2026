import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { LeadModel } from '../../models/lead.model';
import { ClientModel } from '../../models/client.model';
import { CallModel } from '../../models/call.model';
import { FollowUpModel } from '../../models/followup.model';
import { CommissionModel } from '../../models/commission.model';
import { UserModel } from '../../models/user.model';
import { ActivityEventModel } from '../../models/activityEvent.model';
import { ApiResponse } from '../../utils/apiResponse';

export class SalesController {
  static async getMyDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const orgId = new mongoose.Types.ObjectId(user.organizationId);
      const userId = new mongoose.Types.ObjectId(user._id);

      const userDoc = await UserModel.findById(userId);
      const monthlyTarget = userDoc?.salesTarget || 50000;

      const [myTotalLeads, myActiveLeads, myConvertedClients, myLostLeads, totalCalls, upcomingFollowUps] =
        await Promise.all([
          LeadModel.countDocuments({ organizationId: orgId, assignedTo: userId }),
          LeadModel.countDocuments({
            organizationId: orgId,
            assignedTo: userId,
            status: { $nin: ['Converted', 'Lost'] },
          }),
          LeadModel.countDocuments({ organizationId: orgId, assignedTo: userId, status: 'Converted' }),
          LeadModel.countDocuments({ organizationId: orgId, assignedTo: userId, status: 'Lost' }),
          CallModel.countDocuments({ organizationId: orgId, recordedBy: userId }),
          FollowUpModel.countDocuments({
            organizationId: orgId,
            assignedTo: userId,
            status: 'Pending',
          }),
        ]);

      // Attributed Revenue from converted clients or payments
      const [attributedResult] = await ClientModel.aggregate([
        { $match: { organizationId: orgId, assignedSalesMember: userId } },
        { $group: { _id: null, total: { $sum: '$totalContractAmount' } } },
      ]);
      const attributedRevenue = attributedResult?.total || 0;

      // Commission Earned
      const [commissionResult] = await CommissionModel.aggregate([
        { $match: { organizationId: orgId, salesMemberId: userId, status: { $in: ['Approved', 'Paid'] } } },
        { $group: { _id: null, total: { $sum: '$commissionAmount' } } },
      ]);
      const commissionEarned = commissionResult?.total || 0;

      const conversionRate = myTotalLeads > 0 ? Math.round((myConvertedClients / myTotalLeads) * 100 * 10) / 10 : 0;

      // Lead stage breakdown
      const leadStagesRaw = await LeadModel.aggregate([
        { $match: { organizationId: orgId, assignedTo: userId } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]);
      const leadStageBreakdown = leadStagesRaw.map((s) => ({ stage: s._id, count: s.count }));

      const recentActivity = await ActivityEventModel.find({ organizationId: orgId })
        .populate('performedBy', 'name email avatar')
        .sort({ createdAt: -1 })
        .limit(10);

      return ApiResponse.success(res, {
        myTotalLeads,
        myActiveLeads,
        myConvertedClients,
        myLostLeads,
        totalCalls,
        upcomingFollowUps,
        monthlyTarget,
        attributedRevenue,
        commissionEarned,
        conversionRate,
        leadStageBreakdown,
        recentActivity,
      });
    } catch (error) {
      next(error);
    }
  }
}
