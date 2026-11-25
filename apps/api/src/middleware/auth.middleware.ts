import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { AppError } from '../utils/appError';
import { UserModel, IUserDoc } from '../models/user.model';
import { Permission, UserRole } from '@agencyos/shared';

export interface AuthenticatedUser {
  _id: string;
  organizationId: string;
  name: string;
  email: string;
  role: UserRole;
  permissions: Permission[];
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let token: string | undefined;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      return next(new AppError('Authentication required. Please log in.', 401));
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, config.jwt.accessSecret);
    } catch (err) {
      return next(new AppError('Invalid or expired authentication token.', 401));
    }

    const user = await UserModel.findById(decoded.userId).lean();
    if (!user || !user.isActive) {
      return next(new AppError('User account is deactivated or no longer exists.', 401));
    }

    req.user = {
      _id: user._id.toString(),
      organizationId: user.organizationId.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      permissions: (user.permissions as Permission[]) || [],
    };

    next();
  } catch (error) {
    next(error);
  }
};
