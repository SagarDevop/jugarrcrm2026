import { Request, Response, NextFunction } from 'express';
import { NotificationModel } from '../../models/notification.model';
import { ApiResponse } from '../../utils/apiResponse';

export class NotificationController {
  static async listNotifications(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const notifications = await NotificationModel.find({
        organizationId: user.organizationId,
        recipientId: user._id,
      })
        .sort({ createdAt: -1 })
        .limit(30);

      return ApiResponse.success(res, notifications);
    } catch (error) {
      next(error);
    }
  }

  static async markRead(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const { id } = req.params;

      if (id === 'all') {
        await NotificationModel.updateMany(
          { organizationId: user.organizationId, recipientId: user._id, read: false },
          { $set: { read: true } }
        );
        return ApiResponse.success(res, null, 'All notifications marked as read');
      }

      await NotificationModel.updateOne(
        { _id: id, organizationId: user.organizationId, recipientId: user._id },
        { $set: { read: true } }
      );

      return ApiResponse.success(res, null, 'Notification marked as read');
    } catch (error) {
      next(error);
    }
  }
}
