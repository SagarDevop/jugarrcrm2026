import { AuditLogModel } from '../models/auditLog.model';
import { logger } from '../utils/logger';

export const logAudit = async (params: {
  organizationId: string;
  userId: string;
  userEmail: string;
  action: string;
  entityType: string;
  entityId: string;
  changes?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}) => {
  try {
    await AuditLogModel.create({
      organizationId: params.organizationId,
      userId: params.userId,
      userEmail: params.userEmail,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      changes: params.changes,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    });
  } catch (error) {
    logger.error('Failed to write audit log:', error);
  }
};
