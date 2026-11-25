import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/appError';
import { logger } from '../utils/logger';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errors = err.errors;

  // Mongoose duplicate key error
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'record';
    message = `Duplicate record found with ${field}: "${err.keyValue?.[field]}"`;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation error occurred';
    errors = {};
    for (const key in err.errors) {
      errors[key] = [err.errors[key].message];
    }
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication token invalid or expired. Please sign in again.';
  }

  if (statusCode >= 500) {
    logger.error(`[UnhandledError] ${req.method} ${req.url}:`, err);
  }

  res.status(statusCode).json({
    success: false,
    error: message,
    errors,
  });
};
