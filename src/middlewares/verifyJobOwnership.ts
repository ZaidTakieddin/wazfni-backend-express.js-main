import { Request, Response, NextFunction } from 'express';
import httpStatus from 'http-status';
import prisma from '../config/prisma';
import ApiError from '../utils/ApiError';
import catchAsync from '../utils/catchAsync';

/**
 * Middleware to verify that the requested job (via jobId param)
 * belongs to the company associated with the authenticated user.
 */
export const verifyJobOwnership = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const jobId = req.params.jobId;
    const userId = req.user?.id;

    if (!userId) {
      // Should be caught by 'auth' middleware first
      return next(
        new ApiError(httpStatus.UNAUTHORIZED, 'Authentication required'),
      );
    }
    if (!jobId) {
      // Should be caught by validation middleware first
      return next(
        new ApiError(httpStatus.BAD_REQUEST, 'Job ID parameter is required'),
      );
    }

    // 1. Get requesting user's company ID
    const company = await prisma.company.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!company) {
      // User is authenticated but not linked to a company
      return next(
        new ApiError(
          httpStatus.FORBIDDEN,
          'User is not associated with a company',
        ),
      );
    }
    const userCompanyId = company.id;

    // 2. Get the job's owning company ID
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: { companyId: true },
    });
    if (!job) {
      // Job doesn't exist (even if jobId format was valid)
      return next(new ApiError(httpStatus.NOT_FOUND, 'Job not found'));
    }
    const jobOwnerCompanyId = job.companyId;

    // 3. Compare IDs
    if (userCompanyId !== jobOwnerCompanyId) {
      // User's company does not own this job
      return next(
        new ApiError(
          httpStatus.FORBIDDEN,
          'You do not have permission to access this resource',
        ),
      );
    }

    // Ownership verified, proceed to the controller
    next();
  },
);
