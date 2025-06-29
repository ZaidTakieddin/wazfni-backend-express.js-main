import { Request, Response } from 'express';
import httpStatus from 'http-status';
import * as categoryService from '../services/category.service';
import catchAsync from '../utils/catchAsync';
import ApiError from '../utils/ApiError';
import { parsePaginationOptions } from '../utils/pagination';

export const createCategory = catchAsync(
  async (req: Request, res: Response) => {
    const category = await categoryService.createCategory(req.body);
    res.status(httpStatus.CREATED).send(category);
  },
);

export const getCategories = catchAsync(async (req: Request, res: Response) => {
  const paginationOptions = parsePaginationOptions(req.query, 'name');
  const categories = await categoryService.getCategories(paginationOptions);
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

// SubCategory Controllers

export const createSubCategory = catchAsync(
  async (req: Request, res: Response) => {
    const categoryId = req.params.categoryId;
    if (typeof categoryId !== 'string') {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'Category ID must be provided',
      );
    }

    const subCategoryData = {
      ...req.body,
      category: {
        connect: { id: categoryId },
      },
    };

    const subCategory =
      await categoryService.createSubCategory(subCategoryData);
    res.status(httpStatus.CREATED).send(subCategory);
  },
);

export const getSubCategoriesByCategory = catchAsync(
  async (req: Request, res: Response) => {
    const categoryId = req.params.categoryId;
    if (typeof categoryId !== 'string') {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'Category ID must be provided',
      );
    }
    const paginationOptions = parsePaginationOptions(req.query, 'name');
    const subCategories = await categoryService.getSubCategoriesByCategory(
      categoryId,
      paginationOptions,
    );
    res.send(subCategories);
  },
);

export const getSubCategory = catchAsync(
  async (req: Request, res: Response) => {
    const subCategoryId = req.params.subCategoryId;
    if (typeof subCategoryId !== 'string') {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'SubCategory ID must be provided',
      );
    }
    const subCategory = await categoryService.getSubCategoryById(subCategoryId);
    res.send(subCategory);
  },
);

export const updateSubCategory = catchAsync(
  async (req: Request, res: Response) => {
    const subCategoryId = req.params.subCategoryId;
    if (typeof subCategoryId !== 'string') {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'SubCategory ID must be provided',
      );
    }
    const subCategory = await categoryService.updateSubCategory(
      subCategoryId,
      req.body,
    );
    res.send(subCategory);
  },
);

export const deleteSubCategory = catchAsync(
  async (req: Request, res: Response) => {
    const subCategoryId = req.params.subCategoryId;
    if (typeof subCategoryId !== 'string') {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'SubCategory ID must be provided',
      );
    }
    await categoryService.deleteSubCategory(subCategoryId);
    res.status(httpStatus.NO_CONTENT).send();
  },
);
