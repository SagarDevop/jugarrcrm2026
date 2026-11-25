import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { ApiResponse } from '../../utils/apiResponse';
import { config } from '../../config';
import { logAudit } from '../../middleware/audit.middleware';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: config.cookie.secure,
  sameSite: (config.cookie.secure ? 'none' : 'lax') as 'none' | 'lax',
  domain: config.cookie.domain,
};

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.register(req.body);

      res.cookie('refreshToken', result.tokens.refreshToken, {
        ...COOKIE_OPTIONS,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.cookie('accessToken', result.tokens.accessToken, {
        ...COOKIE_OPTIONS,
        maxAge: 15 * 60 * 1000,
      });

      await logAudit({
        organizationId: result.organization._id.toString(),
        userId: result.user._id.toString(),
        userEmail: result.user.email,
        action: 'ORG_REGISTERED',
        entityType: 'Organization',
        entityId: result.organization._id.toString(),
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      return ApiResponse.success(
        res,
        {
          user: result.user,
          organization: result.organization,
          accessToken: result.tokens.accessToken,
        },
        'Organization and Super Admin account created successfully',
        201
      );
    } catch (error) {
      next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.login(req.body);

      res.cookie('refreshToken', result.tokens.refreshToken, {
        ...COOKIE_OPTIONS,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.cookie('accessToken', result.tokens.accessToken, {
        ...COOKIE_OPTIONS,
        maxAge: 15 * 60 * 1000,
      });

      await logAudit({
        organizationId: result.organization._id.toString(),
        userId: result.user._id.toString(),
        userEmail: result.user.email,
        action: 'USER_LOGIN',
        entityType: 'User',
        entityId: result.user._id.toString(),
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      return ApiResponse.success(
        res,
        {
          user: result.user,
          organization: result.organization,
          accessToken: result.tokens.accessToken,
        },
        'Logged in successfully'
      );
    } catch (error) {
      next(error);
    }
  }

  static async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
      if (!refreshToken) {
        return ApiResponse.error(res, 'Refresh token missing', 401);
      }

      const tokens = await AuthService.refresh(refreshToken);

      res.cookie('refreshToken', tokens.refreshToken, {
        ...COOKIE_OPTIONS,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.cookie('accessToken', tokens.accessToken, {
        ...COOKIE_OPTIONS,
        maxAge: 15 * 60 * 1000,
      });

      return ApiResponse.success(res, { accessToken: tokens.accessToken }, 'Session refreshed');
    } catch (error) {
      next(error);
    }
  }

  static async logout(req: Request, res: Response, next: NextFunction) {
    try {
      res.clearCookie('accessToken', COOKIE_OPTIONS);
      res.clearCookie('refreshToken', COOKIE_OPTIONS);

      if (req.user) {
        await logAudit({
          organizationId: req.user.organizationId,
          userId: req.user._id,
          userEmail: req.user.email,
          action: 'USER_LOGOUT',
          entityType: 'User',
          entityId: req.user._id,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        });
      }

      return ApiResponse.success(res, null, 'Logged out successfully');
    } catch (error) {
      next(error);
    }
  }

  static async me(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) return ApiResponse.error(res, 'Unauthorized', 401);
      const data = await AuthService.getMe(req.user._id);
      return ApiResponse.success(res, data, 'User profile retrieved');
    } catch (error) {
      next(error);
    }
  }
}
