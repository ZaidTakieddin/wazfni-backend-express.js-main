import { Request, Response } from 'express';
import catchAsync from '../utils/catchAsync';
import ApiError from '../utils/ApiError';
import httpStatus from 'http-status';
import * as categoryClickService from '../services/categoryClick.service';
import { parsePaginationOptions } from '../utils/pagination';

export const recordCategoryClick = catchAsync(
  async (req: Request, res: Response) => {
    if (!req.user) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate');
    }

    const { subCategoryId } = req.params;
    if (!subCategoryId) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'SubCategory ID is required');
    }

    const userId = req.user.id;

    const categoryClick = await categoryClickService.recordCategoryClick(
      userId,
      subCategoryId,
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
    const paginationOptions =
      parsePaginationOptions(req.query, 'lastClickedAt') || {};

    const categoryClicks = await categoryClickService.getUserCategoryClicks(
      userId,
      paginationOptions,
    );

    res.status(200).json({
      status: 'success',
      data: categoryClicks,
    });
  },
);
