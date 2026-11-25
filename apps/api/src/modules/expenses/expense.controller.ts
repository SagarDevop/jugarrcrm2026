import { Request, Response, NextFunction } from 'express';
import { ExpenseModel } from '../../models/expense.model';
import { ApiResponse } from '../../utils/apiResponse';
import { AppError } from '../../utils/appError';
import { logAudit } from '../../middleware/audit.middleware';

export class ExpenseController {
  static async listExpenses(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const filter: any = { organizationId: user.organizationId };

      if (req.query.category) filter.category = req.query.category;
      if (req.query.status) filter.approvalStatus = req.query.status;

      const expenses = await ExpenseModel.find(filter)
        .populate('recordedBy', 'name email')
        .populate('approvedBy', 'name email')
        .sort({ date: -1 });

      return ApiResponse.success(res, expenses);
    } catch (error) {
      next(error);
    }
  }

  static async createExpense(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const data = req.body;

      const expense = await ExpenseModel.create({
        ...data,
        organizationId: user.organizationId,
        recordedBy: user._id,
        approvalStatus: 'Approved', // super admin or authorized manager
        approvedBy: user._id,
        approvedAt: new Date(),
      });

      await logAudit({
        organizationId: user.organizationId,
        userId: user._id,
        userEmail: user.email,
        action: 'EXPENSE_RECORDED',
        entityType: 'Expense',
        entityId: expense._id.toString(),
        changes: { amount: expense.amount, category: expense.category, title: expense.title },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      return ApiResponse.success(res, expense, 'Expense recorded successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  static async updateApproval(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const { id } = req.params;
      const { approvalStatus } = req.body;

      const expense = await ExpenseModel.findOne({ _id: id, organizationId: user.organizationId });
      if (!expense) throw new AppError('Expense not found.', 404);

      expense.approvalStatus = approvalStatus;
      expense.approvedBy = user._id as any;
      expense.approvedAt = new Date();
      await expense.save();

      return ApiResponse.success(res, expense, `Expense approval status updated to ${approvalStatus}`);
    } catch (error) {
      next(error);
    }
  }
}
