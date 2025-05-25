import { Request, Response } from 'express';
import catchAsync from '../utils/catchAsync';
import ApiError from '../utils/ApiError';
import httpStatus from 'http-status';
import * as jobViewHistoryService from '../services/jobViewHistory.service';

export const recordJobView = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate');
  }

  const { jobId } = req.params;
  if (!jobId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Job ID is required');
  }

  const userId = req.user.id;
  const jobView = await jobViewHistoryService.recordJobView(userId, jobId);

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
    const jobViews = await jobViewHistoryService.getUserJobViews(userId);

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
    const recommendedJobs =
      await jobViewHistoryService.getRecommendedJobs(userId);

    res.status(200).json({
      status: 'success',
      data: recommendedJobs,
    });
  },
);
