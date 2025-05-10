import { Request, Response, NextFunction } from 'express';
import httpStatus from 'http-status';
import { verifyToken } from '../utils/jwt';
import ApiError from '../utils/ApiError';
import prisma from '../config/prisma';
import { User } from '@prisma/client';

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: User; // Or just userId?: string if you prefer
    }
  }
}

const auth = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate'));
  }

  const token = authHeader.split(' ')[1];

  try {
    // @ts-ignore - Linter incorrectly flags verifyToken return type compatibility
    const payload = verifyToken(token);

    // Keep the checks here for runtime safety
    if (!payload || payload.sub === undefined) {
      return next(
        new ApiError(
          httpStatus.UNAUTHORIZED,
          'Invalid token: Missing payload or user identifier',
        ),
      );
    }
    if (typeof payload.sub !== 'string') {
      return next(
        new ApiError(
          httpStatus.UNAUTHORIZED,
          'Invalid token: User identifier is not a string',
        ),
      );
    }
    const userId: string = payload.sub;

    // Optional: Fetch the full user object from DB and attach it
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return next(
        new ApiError(httpStatus.UNAUTHORIZED, 'User not found for token'),
      );
    }

    req.user = user; // Attach user object to request
    // Or: req.userId = userId; // If you only need the ID

    next();
  } catch (error) {
    // Handle errors from verifyToken (expired, invalid)
    if (error instanceof ApiError) {
      return next(error);
    }
    // Handle other potential errors
    return next(new ApiError(httpStatus.UNAUTHORIZED, 'Authentication failed'));
  }
};

export default auth;
