import { Request, Response, NextFunction } from 'express';
import { AuditLogModel } from '../../models/auditLog.model';
import { ApiResponse } from '../../utils/apiResponse';

export class AuditController {
  static async listLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const logs = await AuditLogModel.find({ organizationId: user.organizationId })
        .sort({ createdAt: -1 })
        .limit(100);

      return ApiResponse.success(res, logs);
    } catch (error) {
      next(error);
    }
  }
}
