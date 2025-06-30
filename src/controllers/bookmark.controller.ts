import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../utils/catchAsync';
import ApiError from '../utils/ApiError';
import * as bookmarkService from '../services/bookmark.service';

/**
 * Bookmark a job
 */
export const bookmarkJob = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const { jobId } = req.body;

  if (!userId) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'User not authenticated');
  }

  const bookmark = await bookmarkService.bookmarkJob(userId, jobId);

  res.status(httpStatus.CREATED).json({
    success: true,
    message: 'Job bookmarked successfully',
    data: bookmark,
  });
});

/**
 * Remove a job bookmark
 */
export const unbookmarkJob = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const { jobId } = req.params;

  if (!userId) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'User not authenticated');
  }

  if (!jobId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Job ID is required');
  }

  await bookmarkService.unbookmarkJob(userId, jobId);

  res.status(httpStatus.OK).json({
    success: true,
    message: 'Job unbookmarked successfully',
  });
});

/**
 * Get all bookmarked jobs for a user
 * Supports optional pagination - if no pagination params provided, returns all data
 */
export const getBookmarkedJobs = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'User not authenticated');
    }

    // Pass the entire query object to the service for optional pagination
    const result = await bookmarkService.getBookmarkedJobs(userId, req.query);

    res.status(httpStatus.OK).json({
      success: true,
      message: 'Bookmarked jobs retrieved successfully',
      ...result, // This will be either { data } or { data, pagination }
    });
  },
);

/**
 * Check if a job is bookmarked
 */
export const isJobBookmarked = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { jobId } = req.params;

    if (!userId) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'User not authenticated');
    }

    if (!jobId) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Job ID is required');
    }

    const isBookmarked = await bookmarkService.isJobBookmarked(userId, jobId);

    res.status(httpStatus.OK).json({
      success: true,
      data: { isBookmarked },
    });
  },
);
