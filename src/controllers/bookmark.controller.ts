import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../utils/catchAsync';
import * as bookmarkService from '../services/bookmark.service';
import ApiError from '../utils/ApiError';
import { parsePaginationOptions } from '../utils/pagination';

export const bookmarkJob = catchAsync(async (req: Request, res: Response) => {
  const { jobId } = req.params;
  const userId = req.user?.id;
  if (!userId) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'User not authenticated');
  }
  const result = await bookmarkService.bookmarkJob(userId, jobId);
  res.status(httpStatus.CREATED).send(result);
});

export const unbookmarkJob = catchAsync(async (req: Request, res: Response) => {
  const { jobId } = req.params;
  const userId = req.user?.id;
  if (!userId) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'User not authenticated');
  }
  const result = await bookmarkService.unbookmarkJob(userId, jobId);

  res.status(httpStatus.OK).send(result);
});

export const getBookmarkedJobs = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'User not authenticated');
    }

    // Parse pagination options from query parameters
    const paginationOptions = parsePaginationOptions(req.query, 'createdAt');

    const result = await bookmarkService.getBookmarkedJobs(
      userId,
      paginationOptions,
    );
    res.send(result);
  },
);

export const isJobBookmarked = catchAsync(
  async (req: Request, res: Response) => {
    const { jobId } = req.params;
    const userId = req.user?.id;
    if (!userId) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'User not authenticated');
    }
    const result = await bookmarkService.isJobBookmarked(userId, jobId);
    res.send({ isBookmarked: result });
  },
);
