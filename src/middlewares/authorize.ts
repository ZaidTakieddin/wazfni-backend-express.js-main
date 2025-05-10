import { Request, Response, NextFunction } from 'express';
import httpStatus from 'http-status';
import ApiError from '../utils/ApiError';
import { Role } from '@prisma/client';
import prisma from '../config/prisma';

/**
 * Middleware to authorize based on roles and company association.
 * @param requiredRoles - Array of allowed roles.
 * @param requireCompany - Whether the user must be associated with a company.
 */
const authorize =
  (requiredRoles: Role[] = [], requireCompany = false) =>
  async (req: Request, res: Response, next: NextFunction) => {
    // Assumes auth middleware has run and attached req.user
    if (!req.user) {
      return next(
        new ApiError(httpStatus.UNAUTHORIZED, 'Authentication required'),
      );
    }

    // Check role if requiredRoles are specified
    if (requiredRoles.length && !requiredRoles.includes(req.user.role)) {
      return next(
        new ApiError(
          httpStatus.FORBIDDEN,
          'Forbidden: Insufficient role permissions',
        ),
      );
    }

    // Check company association if required
    if (requireCompany) {
      // We need to check the database for the company association
      const company = await prisma.company.findUnique({
        where: { userId: req.user.id },
        select: { id: true }, // Only select id for efficiency
      });

      if (!company) {
        return next(
          new ApiError(
            httpStatus.FORBIDDEN,
            'Forbidden: User must be associated with a company',
          ),
        );
      }
      // Optionally attach companyId to request if needed downstream
      // req.companyId = company.id;
    }

    next();
  };

export default authorize;
