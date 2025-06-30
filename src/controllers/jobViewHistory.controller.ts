import { Request, Response } from 'express';
import catchAsync from '../utils/catchAsync';
import ApiError from '../utils/ApiError';
import httpStatus from 'http-status';
import * as jobViewHistoryService from '../services/jobViewHistory.service';
import { parsePaginationOptions } from '../utils/pagination';

export const recordJobView = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate');
  }

  const { jobId } = req.params;
  if (!jobId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Job ID is required');
  }

  const userId = req.user.id;
  const jobView = await jobViewHistoryService.createJobView(userId, jobId);

  res.status(200).json({
    status: 'success',
    data: jobView,
  });
});

export const getUserJobViews = catchAsync(
  async (req: Request, res: Response) => {
    if (!req.user) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate');
    }

    const userId = req.user.id;
    const paginationOptions =
      parsePaginationOptions(req.query, 'lastViewedAt') || {};
    const jobViews = await jobViewHistoryService.getUserJobViewHistory(
      userId,
      paginationOptions,
    );

    res.status(200).json({
      status: 'success',
      data: jobViews,
    });
  },
);

export const getRecommendedJobs = catchAsync(
  async (req: Request, res: Response) => {
    if (!req.user) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate');
    }

    const userId = req.user.id;
    const paginationOptions =
      parsePaginationOptions(req.query, 'createdAt') || {};
    const recommendedJobs = await jobViewHistoryService.getRecommendedJobs(
      userId,
      paginationOptions,
    );

    res.status(200).json({
      status: 'success',
      data: recommendedJobs,
    });
  },
);
