import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/appError';
import { Permission, UserRole, USER_ROLES } from '@agencyos/shared';

export const requireRole = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Unauthorized. Authentication required.', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(
          `Forbidden: Role '${req.user.role}' lacks permission for this action.`,
          403
        )
      );
    }

    next();
  };
};

export const requirePermission = (permission: Permission) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Unauthorized. Authentication required.', 401));
    }

    // Super Admin has all permissions
    if (req.user.role === USER_ROLES.SUPER_ADMIN) {
      return next();
    }

    if (!req.user.permissions.includes(permission)) {
      return next(
        new AppError(
          `Forbidden: Missing required permission '${permission}'.`,
          403
        )
      );
    }

    next();
  };
};

export const canViewFinancials = (user?: Express.Request['user']): boolean => {
  if (!user) return false;
  if (user.role === USER_ROLES.SUPER_ADMIN) return true;
  return user.permissions.includes('finance.view_revenue' as Permission) ||
    user.permissions.includes('finance.view_profit' as Permission);
};
