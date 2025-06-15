import { Prisma, ApprovalStatus } from '@prisma/client';
import httpStatus from 'http-status';
import prisma from '../config/prisma';
import ApiError from '../utils/ApiError';

/**
 * Bookmark a job for a user
 * @param userId - The ID of the user
 * @param jobId - The ID of the job to bookmark
 * @returns {Promise<{ id: string }>}
 * @throws {ApiError}
 */
export const bookmarkJob = async (
  userId: string,
  jobId?: string,
): Promise<{ id: string }> => {
  if (!jobId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Job ID is required');
  }
  // Check if job exists and is approved
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: {
      company: {
        select: { approvalStatus: true },
      },
    },
  });

  if (!job) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Job not found');
  }

  // Only allow bookmarking approved jobs from approved companies
  if (
    job.approvalStatus !== ApprovalStatus.APPROVED ||
    job.company.approvalStatus !== ApprovalStatus.APPROVED
  ) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Cannot bookmark unapproved job',
    );
  }

  // Create bookmark
  try {
    await prisma.bookmark.create({
      data: {
        user: { connect: { id: userId } },
        job: { connect: { id: jobId } },
      },
    });
    return { id: jobId };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        throw new ApiError(
          httpStatus.CONFLICT,
          'You have already bookmarked this job',
        );
      }
    }
    throw error;
  }
};

/**
 * Remove a job bookmark for a user
 * @param userId - The ID of the user
 * @param jobId - The ID of the job to unbookmark
 * @returns {Promise<{ id: string }>}
 * @throws {ApiError}
 */
export const unbookmarkJob = async (
  userId: string,
  jobId?: string,
): Promise<{ id: string }> => {
  if (!jobId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Job ID is required');
  }
  const bookmark = await prisma.bookmark.findUnique({
    where: {
      userId_jobId: {
        userId,
        jobId,
      },
    },
  });

  if (!bookmark) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      'Bookmark not found or already removed',
    );
  }

  await prisma.bookmark.delete({
    where: {
      id: bookmark.id,
    },
  });

  return { id: jobId };
};

/**
 * Get all bookmarked jobs for a user
 * @param userId - The ID of the user
 * @returns {Promise<Array>}
 */
export const getBookmarkedJobs = async (userId: string) => {
  const bookmarks = await prisma.bookmark.findMany({
    where: {
      userId,
      job: {
        approvalStatus: ApprovalStatus.APPROVED,
        company: {
          approvalStatus: ApprovalStatus.APPROVED,
        },
      },
    },
    include: {
      job: {
        include: {
          company: {
            select: {
              name: true,
              logo: true,
            },
          },
          subCategories: {
            include: {
              category: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return bookmarks.map((bookmark) => ({
    ...bookmark.job,
    isBookmarked: true,
    bookmarkedAt: bookmark.createdAt,
  }));
};

/**
 * Check if a job is bookmarked by a user
 * @param userId - The ID of the user
 * @param jobId - The ID of the job to check
 * @returns {Promise<boolean>}
 */
export const isJobBookmarked = async (
  userId: string,
  jobId?: string,
): Promise<boolean> => {
  if (!jobId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Job ID is required');
  }
  const bookmark = await prisma.bookmark.findUnique({
    where: {
      userId_jobId: {
        userId,
        jobId,
      },
    },
  });

  return !!bookmark;
};
