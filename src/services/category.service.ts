import { Category, SubCategory, Prisma } from '@prisma/client';
import httpStatus from 'http-status';
import prisma from '../config/prisma';
import ApiError from '../utils/ApiError';
import {
  PaginationOptions,
  PaginatedResponse,
  ListResponse,
  parsePaginationOptionsLegacy,
  calculateSkip,
  createPaginatedResponse,
  parsePaginationOptions,
  createListResponse,
} from '../utils/pagination';

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
 * Get all categories with their subcategories and pagination.
 * @param paginationOptions - Pagination options
 * @returns Promise with paginated categories
 */
export const getCategories = async (
  paginationOptions: PaginationOptions = {},
): Promise<PaginatedResponse<Category & { subCategories: SubCategory[] }>> => {
  const { page, limit, sortBy, sortOrder } = parsePaginationOptionsLegacy(
    paginationOptions,
    'name',
  );

  // Get total count
  const total = await prisma.category.count();

  // Get categories with pagination
  const categories = await prisma.category.findMany({
    include: {
      subCategories: {
        orderBy: { name: 'asc' },
      },
    },
    skip: calculateSkip(page, limit),
    take: limit,
    orderBy: { [sortBy]: sortOrder },
  });

  return createPaginatedResponse(categories, page, limit, total);
};

/**
 * Get category by ID with subcategories.
 * @param categoryId
 * @returns
 */
export const getCategoryById = async (
  categoryId: string,
): Promise<Category & { subCategories: SubCategory[] }> => {
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    include: {
      subCategories: {
        orderBy: { name: 'asc' },
      },
    },
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
  // Check if category has subcategories
  const subcategoriesCount = await prisma.subCategory.count({
    where: { categoryId },
  });
  if (subcategoriesCount > 0) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Cannot delete category: It has subcategories. Delete subcategories first.',
    );
  }

  try {
    await prisma.category.delete({ where: { id: categoryId } });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2025'
    ) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Category not found');
    }
    throw error;
  }
};

// SubCategory Services

/**
 * Create a subcategory.
 * @param subCategoryBody
 * @returns
 */
export const createSubCategory = async (
  subCategoryBody: Prisma.SubCategoryCreateInput,
): Promise<SubCategory> => {
  // Check if subcategory name already exists within the same category
  const existingSubCategory = await prisma.subCategory.findFirst({
    where: {
      name: subCategoryBody.name,
      categoryId:
        typeof subCategoryBody.category === 'object' &&
        'connect' in subCategoryBody.category
          ? subCategoryBody.category.connect?.id
          : undefined,
    },
  });
  if (existingSubCategory) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'SubCategory name already exists in this category',
    );
  }
  return prisma.subCategory.create({
    data: subCategoryBody,
    include: {
      category: true,
    },
  });
};

/**
 * Get all subcategories for a specific category.
 * @param categoryId
 * @returns
 */
export const getSubCategoriesByCategory = async (
  categoryId: string,
  paginationOptions: PaginationOptions = {},
): Promise<PaginatedResponse<SubCategory & { category: Category }>> => {
  // First check if category exists
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
  });

  if (!category) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Category not found');
  }

  const { page, limit, sortBy, sortOrder } = parsePaginationOptionsLegacy(
    paginationOptions,
    'name',
  );

  const where = { categoryId };

  // Get total count
  const total = await prisma.subCategory.count({ where });

  // Get subcategories with pagination
  const subCategories = await prisma.subCategory.findMany({
    where,
    include: {
      category: true,
    },
    skip: calculateSkip(page, limit),
    take: limit,
    orderBy: { [sortBy]: sortOrder },
  });

  return createPaginatedResponse(subCategories, page, limit, total);
};

/**
 * Get subcategory by ID.
 * @param subCategoryId
 * @returns
 */
export const getSubCategoryById = async (
  subCategoryId: string,
): Promise<SubCategory & { category: Category }> => {
  const subCategory = await prisma.subCategory.findUnique({
    where: { id: subCategoryId },
    include: {
      category: true,
    },
  });
  if (!subCategory) {
    throw new ApiError(httpStatus.NOT_FOUND, 'SubCategory not found');
  }
  return subCategory;
};

/**
 * Update subcategory by ID.
 * @param subCategoryId
 * @param updateBody
 * @returns
 */
export const updateSubCategory = async (
  subCategoryId: string,
  updateBody: Prisma.SubCategoryUpdateInput,
): Promise<SubCategory> => {
  // Get current subcategory to check category context
  const currentSubCategory = await prisma.subCategory.findUnique({
    where: { id: subCategoryId },
  });
  if (!currentSubCategory) {
    throw new ApiError(httpStatus.NOT_FOUND, 'SubCategory not found');
  }

  // Check if name is being updated to an existing name within the same category
  if (updateBody.name && typeof updateBody.name === 'string') {
    const existingSubCategory = await prisma.subCategory.findFirst({
      where: {
        name: updateBody.name,
        categoryId: currentSubCategory.categoryId,
        id: { not: subCategoryId }, // Exclude the current subcategory being updated
      },
    });
    if (existingSubCategory) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'SubCategory name already exists in this category',
      );
    }
  }

  try {
    const updatedSubCategory = await prisma.subCategory.update({
      where: { id: subCategoryId },
      data: updateBody,
      include: {
        category: true,
      },
    });
    return updatedSubCategory;
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2025'
    ) {
      throw new ApiError(httpStatus.NOT_FOUND, 'SubCategory not found');
    }
    throw error;
  }
};

/**
 * Delete subcategory by ID.
 * @param subCategoryId
 */
export const deleteSubCategory = async (
  subCategoryId: string,
): Promise<void> => {
  // Check if subcategory is linked to any jobs
  const linkedJobsCount = await prisma.job.count({
    where: { subCategories: { some: { id: subCategoryId } } },
  });
  if (linkedJobsCount > 0) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Cannot delete subcategory: It is linked to existing jobs.',
    );
  }

  try {
    await prisma.subCategory.delete({ where: { id: subCategoryId } });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2025'
    ) {
      throw new ApiError(httpStatus.NOT_FOUND, 'SubCategory not found');
    }
    throw error;
  }
};

/**
 * Get all categories with optional pagination.
 * Returns paginated response if pagination params are provided, otherwise returns all data.
 * @param query - Query parameters (including optional pagination)
 * @returns Promise with categories list
 */
export const getCategoriesOptional = async (
  query: any = {},
): Promise<ListResponse<Category & { subCategories: SubCategory[] }>> => {
  const paginationOptions = parsePaginationOptions(query, 'name');

  const includeClause = {
    subCategories: {
      orderBy: { name: 'asc' as const },
    },
  };

  let categories;
  let total: number | undefined;

  if (paginationOptions) {
    // Paginated query
    total = await prisma.category.count();

    categories = await prisma.category.findMany({
      include: includeClause,
      skip: calculateSkip(paginationOptions.page!, paginationOptions.limit!),
      take: paginationOptions.limit!,
      orderBy: { [paginationOptions.sortBy!]: paginationOptions.sortOrder! },
    });
  } else {
    // Non-paginated query - return all data
    categories = await prisma.category.findMany({
      include: includeClause,
      orderBy: { name: 'asc' }, // Default sorting
    });
  }

  return createListResponse(categories, paginationOptions, total);
};

/**
 * Get subcategories by category with optional pagination.
 * Returns paginated response if pagination params are provided, otherwise returns all data.
 * @param categoryId - Category ID
 * @param query - Query parameters (including optional pagination)
 * @returns Promise with subcategories list
 */
export const getSubCategoriesByCategoryOptional = async (
  categoryId: string,
  query: any = {},
): Promise<ListResponse<SubCategory & { category: Category }>> => {
  // First check if category exists
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
  });

  if (!category) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Category not found');
  }

  const paginationOptions = parsePaginationOptions(query, 'name');
  const where = { categoryId };

  let subCategories;
  let total: number | undefined;

  if (paginationOptions) {
    // Paginated query
    total = await prisma.subCategory.count({ where });

    subCategories = await prisma.subCategory.findMany({
      where,
      include: {
        category: true,
      },
      skip: calculateSkip(paginationOptions.page!, paginationOptions.limit!),
      take: paginationOptions.limit!,
      orderBy: { [paginationOptions.sortBy!]: paginationOptions.sortOrder! },
    });
  } else {
    // Non-paginated query - return all data
    subCategories = await prisma.subCategory.findMany({
      where,
      include: {
        category: true,
      },
      orderBy: { name: 'asc' }, // Default sorting
    });
  }

  return createListResponse(subCategories, paginationOptions, total);
};
