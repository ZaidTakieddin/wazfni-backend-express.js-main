import { Request, Response } from 'express';
import httpStatus from 'http-status';
import * as categoryService from '../services/category.service';
import catchAsync from '../utils/catchAsync';
import ApiError from '../utils/ApiError';

export const createCategory = catchAsync(
  async (req: Request, res: Response) => {
    const category = await categoryService.createCategory(req.body);
    res.status(httpStatus.CREATED).send(category);
  },
);

export const getCategories = catchAsync(async (req: Request, res: Response) => {
  const categories = await categoryService.getAllCategories();
  res.send(categories);
});

export const getCategory = catchAsync(async (req: Request, res: Response) => {
  const categoryId = req.params.categoryId;
  if (typeof categoryId !== 'string') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Category ID must be provided');
  }
  const category = await categoryService.getCategoryById(categoryId);
  res.send(category);
});

export const updateCategory = catchAsync(
  async (req: Request, res: Response) => {
    const categoryId = req.params.categoryId;
    if (typeof categoryId !== 'string') {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'Category ID must be provided',
      );
    }
    const category = await categoryService.updateCategory(categoryId, req.body);
    res.send(category);
  },
);

export const deleteCategory = catchAsync(
  async (req: Request, res: Response) => {
    const categoryId = req.params.categoryId;
    if (typeof categoryId !== 'string') {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'Category ID must be provided',
      );
    }
    await categoryService.deleteCategory(categoryId);
    res.status(httpStatus.NO_CONTENT).send();
  },
);
