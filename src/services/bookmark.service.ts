import { Bookmark, ApprovalStatus } from '@prisma/client';
import httpStatus from 'http-status';
import prisma from '../config/prisma';
import ApiError from '../utils/ApiError';
import {
  PaginationOptions,
  ListResponse,
  parsePaginationOptions,
  calculateSkip,
  createListResponse,
} from '../utils/pagination';

/**
 * Bookmark a job for a user.
 * @param userId
 * @param jobId
 * @returns {Promise<Bookmark>}
 * @throws {ApiError}
 */
export const bookmarkJob = async (
  userId: string,
  jobId: string,
): Promise<Bookmark> => {
  // 1. Check if job exists and is approved
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    select: {
      id: true,
      approvalStatus: true,
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
      'Can only bookmark approved jobs from approved companies',
    );
  }

  // 2. Check if already bookmarked
  const existingBookmark = await prisma.bookmark.findUnique({
    where: {
      userId_jobId: {
        userId,
        jobId,
      },
    },
  });

  if (existingBookmark) {
    throw new ApiError(httpStatus.CONFLICT, 'Job is already bookmarked');
  }

  // 3. Create bookmark
  const bookmark = await prisma.bookmark.create({
    data: {
      userId,
      jobId,
    },
  });

  return bookmark;
};

/**
 * Remove a bookmark for a user.
 * @param userId
 * @param jobId
 * @returns {Promise<void>}
 * @throws {ApiError}
 */
export const unbookmarkJob = async (
  userId: string,
  jobId: string,
): Promise<void> => {
  // Check if bookmark exists
  const bookmark = await prisma.bookmark.findUnique({
    where: {
      userId_jobId: {
        userId,
        jobId,
      },
    },
  });

  if (!bookmark) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Bookmark not found');
  }

  // Delete bookmark
  await prisma.bookmark.delete({
    where: {
      id: bookmark.id,
    },
  });
};

/**
 * Check if a job is bookmarked by a user.
 * @param userId
 * @param jobId
 * @returns {Promise<boolean>}
 */
export const isJobBookmarked = async (
  userId: string,
  jobId: string,
): Promise<boolean> => {
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

/**
 * Get all bookmarked jobs for a user with optional pagination.
 * Returns paginated response if pagination params are provided, otherwise returns all data.
 * @param userId
 * @param query - Query parameters (including optional pagination)
 * @returns {Promise<ListResponse<any>>}
 */
export const getBookmarkedJobs = async (
  userId: string,
  query: any = {},
): Promise<ListResponse<any>> => {
  const paginationOptions = parsePaginationOptions(query, 'createdAt');

  const where = {
    userId,
    job: {
      isArchived: false,
      approvalStatus: ApprovalStatus.APPROVED,
      company: {
        approvalStatus: ApprovalStatus.APPROVED,
      },
    },
  };

  const includeClause = {
    job: {
      include: {
        company: true,
        subCategories: {
          include: {
            category: true,
          },
        },
        _count: {
          select: { applications: true },
        },
      },
    },
  };

  let bookmarks;
  let total: number | undefined;

  if (paginationOptions) {
    // Paginated query
    total = await prisma.bookmark.count({ where });

    bookmarks = await prisma.bookmark.findMany({
      where,
      include: includeClause,
      skip: calculateSkip(paginationOptions.page!, paginationOptions.limit!),
      take: paginationOptions.limit!,
      orderBy: { [paginationOptions.sortBy!]: paginationOptions.sortOrder! },
    });
  } else {
    // Non-paginated query - return all data
    bookmarks = await prisma.bookmark.findMany({
      where,
      include: includeClause,
      orderBy: { createdAt: 'desc' }, // Default sorting
    });
  }

  // Transform the response to return jobs with bookmark metadata
  const jobs = bookmarks.map((bookmark) => ({
    ...bookmark.job,
    bookmarkedAt: bookmark.createdAt,
    isBookmarked: true,
  }));

  return createListResponse(jobs, paginationOptions, total);
};
