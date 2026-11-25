import { Request, Response, NextFunction } from 'express';
import { FollowUpModel } from '../../models/followup.model';
import { ApiResponse } from '../../utils/apiResponse';
import { AppError } from '../../utils/appError';

export class FollowUpController {
  static async listFollowUps(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const filter: any = { organizationId: user.organizationId };

      if (req.query.status) filter.status = req.query.status;
      if (req.query.myOnly === 'true') filter.assignedTo = user._id;

      const followups = await FollowUpModel.find(filter)
        .populate('assignedTo', 'name email avatar')
        .populate('createdBy', 'name email')
        .sort({ dueDate: 1 });

      return ApiResponse.success(res, followups);
    } catch (error) {
      next(error);
    }
  }

  static async createFollowUp(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const data = req.body;

      const followup = await FollowUpModel.create({
        ...data,
        organizationId: user.organizationId,
        assignedTo: data.assignedTo || user._id,
        createdBy: user._id,
      });

      const populated = await FollowUpModel.findById(followup._id)
        .populate('assignedTo', 'name email avatar')
        .populate('createdBy', 'name email');

      return ApiResponse.success(res, populated, 'Follow-up created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  static async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const { id } = req.params;
      const { status } = req.body;

      const followup = await FollowUpModel.findOne({ _id: id, organizationId: user.organizationId });
      if (!followup) throw new AppError('Follow-up not found.', 404);

      followup.status = status;
      if (status === 'Completed') {
        followup.completedAt = new Date();
      }
      await followup.save();

      return ApiResponse.success(res, followup, 'Follow-up updated successfully');
    } catch (error) {
      next(error);
    }
  }
}
