import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { UserModel } from '../../models/user.model';
import { ApiResponse } from '../../utils/apiResponse';
import { AppError } from '../../utils/appError';
import { logAudit } from '../../middleware/audit.middleware';
import { USER_ROLES, DEFAULT_SALES_PERMISSIONS } from '@agencyos/shared';

export class TeamController {
  static async listUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const users = await UserModel.find({ organizationId: req.user!.organizationId })
        .select('-passwordHash')
        .sort({ createdAt: -1 });

      return ApiResponse.success(res, users);
    } catch (error) {
      next(error);
    }
  }

  static async createMember(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, email, password, phone, role, salesTarget, commissionPercentage, permissions } = req.body;

      const existing = await UserModel.findOne({
        organizationId: req.user!.organizationId,
        email: email.toLowerCase(),
      });
      if (existing) {
        throw new AppError('A team member with this email already exists in your organization.', 409);
      }

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      const userRole = role || USER_ROLES.SALES_MEMBER;
      const userPermissions = permissions && permissions.length > 0 ? permissions : DEFAULT_SALES_PERMISSIONS;

      const user = await UserModel.create({
        organizationId: req.user!.organizationId,
        name,
        email: email.toLowerCase(),
        passwordHash,
        role: userRole,
        permissions: userPermissions,
        phone,
        salesTarget: salesTarget || 50000,
        commissionPercentage: commissionPercentage || 10,
        isActive: true,
      });

      await logAudit({
        organizationId: req.user!.organizationId,
        userId: req.user!._id,
        userEmail: req.user!.email,
        action: 'TEAM_MEMBER_CREATED',
        entityType: 'User',
        entityId: user._id.toString(),
        changes: { name, email, role: userRole },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      const userSafe = user.toObject();
      delete (userSafe as any).passwordHash;

      return ApiResponse.success(res, userSafe, 'Team member created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  static async updateMember(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { name, phone, isActive, salesTarget, commissionPercentage, permissions, role } = req.body;

      const user = await UserModel.findOne({ _id: id, organizationId: req.user!.organizationId });
      if (!user) {
        throw new AppError('User not found.', 404);
      }

      if (name !== undefined) user.name = name;
      if (phone !== undefined) user.phone = phone;
      if (isActive !== undefined) user.isActive = isActive;
      if (salesTarget !== undefined) user.salesTarget = salesTarget;
      if (commissionPercentage !== undefined) user.commissionPercentage = commissionPercentage;
      if (permissions !== undefined) user.permissions = permissions;
      if (role !== undefined) user.role = role;

      await user.save();

      await logAudit({
        organizationId: req.user!.organizationId,
        userId: req.user!._id,
        userEmail: req.user!.email,
        action: 'TEAM_MEMBER_UPDATED',
        entityType: 'User',
        entityId: user._id.toString(),
        changes: { name, isActive, salesTarget, commissionPercentage, permissions, role },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      return ApiResponse.success(res, user, 'User updated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { newPassword } = req.body;

      if (!newPassword || newPassword.length < 6) {
        throw new AppError('Password must be at least 6 characters long.', 400);
      }

      const user = await UserModel.findOne({ _id: id, organizationId: req.user!.organizationId });
      if (!user) {
        throw new AppError('User not found.', 404);
      }

      const salt = await bcrypt.genSalt(10);
      user.passwordHash = await bcrypt.hash(newPassword, salt);
      await user.save();

      await logAudit({
        organizationId: req.user!.organizationId,
        userId: req.user!._id,
        userEmail: req.user!.email,
        action: 'PASSWORD_RESET_BY_ADMIN',
        entityType: 'User',
        entityId: user._id.toString(),
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      return ApiResponse.success(res, null, 'User password reset successfully');
    } catch (error) {
      next(error);
    }
  }
}
