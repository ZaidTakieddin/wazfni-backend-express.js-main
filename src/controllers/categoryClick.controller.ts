import { Request, Response } from 'express';
import catchAsync from '../utils/catchAsync';
import ApiError from '../utils/ApiError';
import httpStatus from 'http-status';
import * as categoryClickService from '../services/categoryClick.service';

export const recordCategoryClick = catchAsync(
  async (req: Request, res: Response) => {
    if (!req.user) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate');
    }

    const { categoryId } = req.params;
    if (!categoryId) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Category ID is required');
    }

    const userId = req.user.id;

    const categoryClick = await categoryClickService.recordCategoryClick(
      userId,
      categoryId,
    );

    res.status(200).json({
      status: 'success',
      data: categoryClick,
    });
  },
);

export const getUserCategoryClicks = catchAsync(
  async (req: Request, res: Response) => {
    if (!req.user) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate');
    }

    const userId = req.user.id;
    const categoryClicks =
      await categoryClickService.getUserCategoryClicks(userId);

    res.status(200).json({
      status: 'success',
      data: categoryClicks,
    });
  },
);
