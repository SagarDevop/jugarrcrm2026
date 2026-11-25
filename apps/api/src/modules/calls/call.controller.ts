import { Request, Response, NextFunction } from 'express';
import { CallModel } from '../../models/call.model';
import { ApiResponse } from '../../utils/apiResponse';
import { AppError } from '../../utils/appError';

export class CallController {
  static async listCalls(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const filter: any = { organizationId: user.organizationId };

      if (req.query.clientId) filter.clientId = req.query.clientId;
      if (req.query.leadId) filter.leadId = req.query.leadId;
      if (req.query.myOnly === 'true') filter.recordedBy = user._id;

      const calls = await CallModel.find(filter)
        .populate('recordedBy', 'name email avatar')
        .sort({ callDate: -1 });

      return ApiResponse.success(res, calls);
    } catch (error) {
      next(error);
    }
  }

  static async recordCall(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const data = req.body;

      const call = await CallModel.create({
        ...data,
        organizationId: user.organizationId,
        recordedBy: user._id,
      });

      const populated = await CallModel.findById(call._id).populate('recordedBy', 'name email avatar');

      return ApiResponse.success(res, populated, 'Call record created successfully', 201);
    } catch (error) {
      next(error);
    }
  }
}
