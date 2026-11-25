import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../../config';
import { AppError } from '../../utils/appError';
import { OrganizationModel } from '../../models/organization.model';
import { UserModel, IUserDoc } from '../../models/user.model';
import { SettingsModel } from '../../models/settings.model';
import {
  USER_ROLES,
  DEFAULT_SUPER_ADMIN_PERMISSIONS,
  DEFAULT_SALES_PERMISSIONS,
  LoginInput,
  RegisterInput,
} from '@agencyos/shared';

export class AuthService {
  static async register(input: RegisterInput) {
    const existingUser = await UserModel.findOne({ email: input.email.toLowerCase() });
    if (existingUser) {
      throw new AppError('An account with this email address already exists.', 409);
    }

    const orgSlug = input.organizationName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') + `-${Date.now().toString().slice(-4)}`;

    const organization = await OrganizationModel.create({
      name: input.organizationName,
      slug: orgSlug,
      currency: 'INR',
    });

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(input.password, salt);

    const superAdmin = await UserModel.create({
      organizationId: organization._id,
      name: input.name,
      email: input.email.toLowerCase(),
      passwordHash,
      role: USER_ROLES.SUPER_ADMIN,
      permissions: DEFAULT_SUPER_ADMIN_PERMISSIONS,
      isActive: true,
    });

    await SettingsModel.create({
      organizationId: organization._id,
      companyName: organization.name,
    });

    const tokens = this.generateTokens(superAdmin._id.toString(), organization._id.toString(), superAdmin.role);

    return {
      user: {
        _id: superAdmin._id,
        organizationId: superAdmin.organizationId,
        name: superAdmin.name,
        email: superAdmin.email,
        role: superAdmin.role,
        permissions: superAdmin.permissions,
        isActive: superAdmin.isActive,
      },
      organization,
      tokens,
    };
  }

  static async login(input: LoginInput) {
    const user = await UserModel.findOne({ email: input.email.toLowerCase() }).select('+passwordHash');
    if (!user) {
      throw new AppError('Invalid email or password.', 401);
    }

    if (!user.isActive) {
      throw new AppError('Your account has been deactivated. Please contact your Super Admin.', 403);
    }

    const isMatch = await bcrypt.compare(input.password, user.passwordHash);
    if (!isMatch) {
      throw new AppError('Invalid email or password.', 401);
    }

    const organization = await OrganizationModel.findById(user.organizationId);
    if (!organization) {
      throw new AppError('Organization not found.', 404);
    }

    const tokens = this.generateTokens(user._id.toString(), organization._id.toString(), user.role);

    return {
      user: {
        _id: user._id,
        organizationId: user.organizationId,
        name: user.name,
        email: user.email,
        role: user.role,
        permissions: user.permissions,
        phone: user.phone,
        avatar: user.avatar,
        isActive: user.isActive,
        salesTarget: user.salesTarget,
        commissionPercentage: user.commissionPercentage,
      },
      organization,
      tokens,
    };
  }

  static generateTokens(userId: string, organizationId: string, role: string) {
    const payload = { userId, organizationId, role };

    const accessToken = jwt.sign(payload, config.jwt.accessSecret, {
      expiresIn: config.jwt.accessExpiresIn as any,
    });

    const refreshToken = jwt.sign(payload, config.jwt.refreshSecret, {
      expiresIn: config.jwt.refreshExpiresIn as any,
    });

    return { accessToken, refreshToken };
  }

  static async refresh(refreshToken: string) {
    try {
      const decoded: any = jwt.verify(refreshToken, config.jwt.refreshSecret);
      const user = await UserModel.findById(decoded.userId);
      if (!user || !user.isActive) {
        throw new AppError('User not found or account is deactivated.', 401);
      }

      const tokens = this.generateTokens(user._id.toString(), user.organizationId.toString(), user.role);
      return tokens;
    } catch (err) {
      throw new AppError('Invalid or expired refresh token. Please log in again.', 401);
    }
  }

  static async getMe(userId: string) {
    const user = await UserModel.findById(userId).lean();
    if (!user) throw new AppError('User not found.', 404);

    const organization = await OrganizationModel.findById(user.organizationId).lean();
    return { user, organization };
  }
}
