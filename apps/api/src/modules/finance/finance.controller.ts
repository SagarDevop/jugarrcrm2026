import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { PaymentModel } from '../../models/payment.model';
import { ExpenseModel } from '../../models/expense.model';
import { ClientModel } from '../../models/client.model';
import { ProjectModel } from '../../models/project.model';
import { RetainerModel } from '../../models/retainer.model';
import { UserModel } from '../../models/user.model';
import { LeadModel } from '../../models/lead.model';
import { ApiResponse } from '../../utils/apiResponse';
import { calculateAnchorPeriod } from '../retainers/retainer.controller';
import { FinancialSyncService } from '../../services/financialSync.service';

export class FinanceController {
  static async getOverview(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = new mongoose.Types.ObjectId(req.user!.organizationId);
      const timeframe = (req.query.timeframe as string) || '6m';

      // Real-time synchronization of all client advances, retainers, and verified payments
      await FinancialSyncService.syncFinancialPipeline(orgId, req.user!._id);

      let startDate = new Date();
      if (timeframe === '30d') {
        startDate.setDate(startDate.getDate() - 30);
      } else if (timeframe === '12m') {
        startDate.setFullYear(startDate.getFullYear() - 1);
      } else {
        // default 6m
        startDate.setMonth(startDate.getMonth() - 6);
      }

      // Total Lifetime Verified Inflow
      const [lifetimeResult] = await PaymentModel.aggregate([
        { $match: { organizationId: orgId, status: 'Verified' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]);
      const totalLifetimeIncome = lifetimeResult?.total || 0;

      // Period Verified Inflow
      const [periodInflowResult] = await PaymentModel.aggregate([
        { $match: { organizationId: orgId, status: 'Verified', paymentDate: { $gte: startDate } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]);
      const verifiedInflow = periodInflowResult?.total || 0;

      // Period Recognized Expenses
      const [periodExpenseResult] = await ExpenseModel.aggregate([
        { $match: { organizationId: orgId, approvalStatus: 'Approved', date: { $gte: startDate } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]);
      const totalExpenses = periodExpenseResult?.total || 0;

      // Pending Receivables
      const [receivablesResult] = await ClientModel.aggregate([
        { $match: { organizationId: orgId, status: { $in: ['Active', 'Prospect', 'On Hold'] } } },
        { $group: { _id: null, total: { $sum: '$remainingBalance' } } },
      ]);
      const pendingReceivables = receivablesResult?.total || 0;

      // Auto-sync: If any active client has a retainer service category but no RetainerModel record yet, auto-create it
      const retainerClients = await ClientModel.find({
        organizationId: orgId,
        serviceCategory: { $regex: /retainer/i },
        status: { $in: ['Active', 'Prospect', 'On Hold'] },
      });

      for (const rc of retainerClients) {
        const hasRetainer = await RetainerModel.exists({ clientId: rc._id, organizationId: orgId });
        if (!hasRetainer) {
          const start = rc.startDate || rc.createdAt || new Date();
          const anchorDay = new Date(start).getDate() || 20;
          const { end } = calculateAnchorPeriod(new Date(start), anchorDay);
          const fee = rc.totalContractAmount > 0 ? rc.totalContractAmount : (rc.customQuotation || 0);

          await RetainerModel.create({
            organizationId: orgId,
            clientId: rc._id,
            serviceName: `${rc.businessName} - Social Media Retainer`,
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
            assignedTeam: rc.assignedSalesMember ? [rc.assignedSalesMember] : (rc.createdBy ? [rc.createdBy] : []),
            currentPeriod: {
              periodNumber: 1,
              startDate: start,
              endDate: end,
              monthlyFee: fee,
              billingStatus: rc.remainingBalance === 0 ? 'Paid' : 'Pending',
              tokenAmount: rc.initialToken || 0,
              pendingBalance: rc.remainingBalance || 0,
              deliverablesStatus: {
                reelsCompleted: 0,
                staticPostsCompleted: 0,
                graphicsCompleted: 0,
                storiesCompleted: 0,
                clientApproved: false,
              },
            },
            historyPeriods: [],
            createdBy: rc.createdBy,
          });
        }
      }

      // Auto-sync: If any active client has Web Development service category but no ProjectModel record yet, auto-create it
      const devClients = await ClientModel.find({
        organizationId: orgId,
        serviceCategory: { $regex: /web|software|dev/i },
        status: { $in: ['Active', 'Prospect', 'On Hold'] },
      });

      for (const dc of devClients) {
        const hasProject = await ProjectModel.exists({ clientId: dc._id, organizationId: orgId });
        if (!hasProject) {
          await ProjectModel.create({
            organizationId: orgId,
            clientId: dc._id,
            name: `${dc.businessName} - Web Platform Development`,
            category: 'Web Development',
            status: 'Planning',
            totalAmount: dc.totalContractAmount || 0,
            remainingAmount: dc.remainingBalance || 0,
            milestones: [
              { title: 'Requirements & Scope Finalization', status: 'Completed' },
              { title: 'UI/UX Design & Architecture', status: 'Pending' },
              { title: 'Frontend & Backend Development', status: 'Pending' },
              { title: 'Testing & Launch', status: 'Pending' },
            ],
            createdBy: dc.createdBy,
          });
        }
      }

      // Active Retainers MRR
      const [mrrResult] = await RetainerModel.aggregate([
        { $match: { organizationId: orgId, status: 'Active' } },
        { $group: { _id: null, total: { $sum: '$monthlyFee' } } },
      ]);
      const monthlyRecurringRevenue = mrrResult?.total || 0;

      // Counts
      const [totalClients, activeClients, activeProjects, activeRetainers] = await Promise.all([
        ClientModel.countDocuments({ organizationId: orgId }),
        ClientModel.countDocuments({ organizationId: orgId, status: 'Active' }),
        ProjectModel.countDocuments({ organizationId: orgId, status: { $in: ['Planning', 'In Progress', 'Review'] } }),
        RetainerModel.countDocuments({ organizationId: orgId, status: 'Active' }),
      ]);

      // Net Profit & Profit Margin (Safe calculation, never dividing by zero)
      const netProfit = verifiedInflow - totalExpenses;
      const profitMargin = verifiedInflow > 0 ? Math.round((netProfit / verifiedInflow) * 100 * 10) / 10 : 0;

      // Revenue vs Expenses Monthly Trend
      const monthlyPayments = await PaymentModel.aggregate([
        { $match: { organizationId: orgId, status: 'Verified', paymentDate: { $gte: startDate } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$paymentDate' } },
            revenue: { $sum: '$amount' },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      const monthlyExpenses = await ExpenseModel.aggregate([
        { $match: { organizationId: orgId, approvalStatus: 'Approved', date: { $gte: startDate } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$date' } },
            expenses: { $sum: '$amount' },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      // Merge monthly trend
      const monthsMap: Record<string, { month: string; revenue: number; expenses: number; profit: number }> = {};
      monthlyPayments.forEach((p) => {
        monthsMap[p._id] = { month: p._id, revenue: p.revenue, expenses: 0, profit: p.revenue };
      });
      monthlyExpenses.forEach((e) => {
        if (!monthsMap[e._id]) {
          monthsMap[e._id] = { month: e._id, revenue: 0, expenses: e.expenses, profit: -e.expenses };
        } else {
          monthsMap[e._id].expenses = e.expenses;
          monthsMap[e._id].profit = monthsMap[e._id].revenue - e.expenses;
        }
      });
      const revenueVsExpenses = Object.values(monthsMap).sort((a, b) => a.month.localeCompare(b.month));

      // Client Acquisition Trend
      const clientTrendsRaw = await ClientModel.aggregate([
        { $match: { organizationId: orgId, createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]);
      const clientAcquisitionTrends = clientTrendsRaw.map((c) => ({ month: c._id, count: c.count }));

      // Service Revenue Breakdown
      const serviceRevenueRaw = await PaymentModel.aggregate([
        { $match: { organizationId: orgId, status: 'Verified' } },
        {
          $group: {
            _id: '$category',
            amount: { $sum: '$amount' },
          },
        },
      ]);
      const serviceRevenueBreakdown = serviceRevenueRaw.map((s) => ({
        service: s._id || 'General',
        amount: s.amount,
      }));

      // Sales Team Performance
      const salesMembers = await UserModel.find({ organizationId: orgId, role: 'SALES_MEMBER' }).lean();
      const salesPerformance = await Promise.all(
        salesMembers.map(async (sm) => {
          const [leadsCount, convertedCount, attributedInflow] = await Promise.all([
            LeadModel.countDocuments({ organizationId: orgId, assignedTo: sm._id }),
            LeadModel.countDocuments({ organizationId: orgId, assignedTo: sm._id, status: 'Converted' }),
            ClientModel.aggregate([
              { $match: { organizationId: orgId, assignedSalesMember: sm._id } },
              { $group: { _id: null, total: { $sum: '$totalContractAmount' } } },
            ]),
          ]);
          return {
            name: sm.name,
            leads: leadsCount,
            conversions: convertedCount,
            revenue: attributedInflow[0]?.total || 0,
          };
        })
      );

      // Project Status Distribution
      const projectStatuses = await ProjectModel.aggregate([
        { $match: { organizationId: orgId } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]);
      const projectStatusDistribution = projectStatuses.map((p) => ({ status: p._id, count: p.count }));

      return ApiResponse.success(res, {
        totalClients,
        activeClients,
        activeProjects,
        activeRetainers,
        totalLifetimeIncome,
        monthlyRevenue: verifiedInflow,
        monthlyRecurringRevenue,
        pendingReceivables,
        totalExpenses,
        netProfit,
        profitMargin,
        revenueVsExpenses,
        profitTrends: revenueVsExpenses.map((r) => ({ month: r.month, profit: r.profit })),
        clientAcquisitionTrends,
        serviceRevenueBreakdown,
        salesPerformance,
        projectStatusDistribution,
      });
    } catch (error) {
      next(error);
    }
  }
}
