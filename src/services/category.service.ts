import { Category, Prisma } from '@prisma/client';
import httpStatus from 'http-status';
import prisma from '../config/prisma';
import ApiError from '../utils/ApiError';

/**
 * Create a category.
 * @param categoryBody
 * @returns
 */
export const createCategory = async (
  categoryBody: Prisma.CategoryCreateInput,
): Promise<Category> => {
  // Check if category name already exists
  const existingCategory = await prisma.category.findUnique({
    where: { name: categoryBody.name },
  });
  if (existingCategory) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Category name already exists');
  }
  return prisma.category.create({ data: categoryBody });
};

/**
 * Get all categories.
 * @returns
 */
export const getAllCategories = async (): Promise<Category[]> => {
  return prisma.category.findMany({ orderBy: { name: 'asc' } });
};

/**
 * Get category by ID.
 * @param categoryId
 * @returns
 */
export const getCategoryById = async (
  categoryId: string,
): Promise<Category> => {
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
  });
  if (!category) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Category not found');
  }
  return category;
};

/**
 * Update category by ID.
 * @param categoryId
 * @param updateBody
 * @returns
 */
export const updateCategory = async (
  categoryId: string,
  updateBody: Prisma.CategoryUpdateInput,
): Promise<Category> => {
  // Check if name is being updated to an existing name
  if (updateBody.name && typeof updateBody.name === 'string') {
    const existingCategory = await prisma.category.findFirst({
      where: {
        name: updateBody.name,
        id: { not: categoryId }, // Exclude the current category being updated
      },
    });
    if (existingCategory) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'Category name already exists',
      );
    }
  }

  try {
    const updatedCategory = await prisma.category.update({
      where: { id: categoryId },
      data: updateBody,
    });
    return updatedCategory;
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2025'
    ) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Category not found');
    }
    throw error; // Re-throw other errors
  }
};

/**
 * Delete category by ID.
 * @param categoryId
 */
export const deleteCategory = async (categoryId: string): Promise<void> => {
  // TODO: Consider what should happen to Jobs linked to this category.
  // Current schema doesn't cascade delete from Category side.
  // Option 1: Manually disconnect category from all jobs before deleting.
  // Option 2: Prevent deletion if category is linked to any jobs.
  // Option 3: Allow deletion (category link becomes null/invalid - requires schema change? No, handled by relation table).

  // Let's implement Option 2 for safety for now:
  const linkedJobsCount = await prisma.job.count({
    where: { categories: { some: { id: categoryId } } },
  });
  if (linkedJobsCount > 0) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Cannot delete category: It is linked to existing jobs.',
    );
  }

  try {
    await prisma.category.delete({ where: { id: categoryId } });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2025'
    ) {
      // If somehow the check above passed but delete failed
      throw new ApiError(httpStatus.NOT_FOUND, 'Category not found');
    }
    throw error;
  }
};
