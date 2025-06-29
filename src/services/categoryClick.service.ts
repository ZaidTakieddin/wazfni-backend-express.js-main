import { PrismaClient, CategoryClick } from '@prisma/client';
import ApiError from '../utils/ApiError';
import httpStatus from 'http-status';
import prisma from '../config/prisma';
import {
  PaginationOptions,
  PaginatedResponse,
  parsePaginationOptions,
  calculateSkip,
  createPaginatedResponse,
} from '../utils/pagination';

const prismaClient = new PrismaClient();

/**
 * Record a category click for tracking user interests
 * @param userId - User ID
 * @param subCategoryId - SubCategory ID
 * @returns Promise with category click record
 */
export const recordCategoryClick = async (
  userId: string,
  subCategoryId: string,
): Promise<CategoryClick> => {
  if (!subCategoryId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'SubCategory ID is required');
  }

  // Verify subcategory exists
  const subCategory = await prismaClient.subCategory.findUnique({
    where: { id: subCategoryId },
  });

  if (!subCategory) {
    throw new ApiError(httpStatus.NOT_FOUND, 'SubCategory not found');
  }

  // Check if user has already clicked this subcategory
  const existingClick = await prismaClient.categoryClick.findUnique({
    where: {
      userId_subCategoryId: {
        userId,
        subCategoryId,
      },
    },
  });

  if (existingClick) {
    // Update existing click - increment count and update timestamp
    return prismaClient.categoryClick.update({
      where: { id: existingClick.id },
      data: {
        clickCount: existingClick.clickCount + 1,
        lastClickedAt: new Date(),
      },
    });
  } else {
    // Create new click record
    return prismaClient.categoryClick.create({
      data: {
        userId,
        subCategoryId,
        clickCount: 1,
        lastClickedAt: new Date(),
      },
    });
  }
};

/**
 * Get user's category clicks for analytics/recommendations with pagination
 * @param userId - User ID
 * @param paginationOptions - Pagination options
 * @returns Promise with paginated category clicks
 */
export const getUserCategoryClicks = async (
  userId: string,
  paginationOptions: PaginationOptions = {},
): Promise<
  PaginatedResponse<
    CategoryClick & {
      subCategory: { name: string; category: { name: string } };
    }
  >
> => {
  const { page, limit, sortBy, sortOrder } = parsePaginationOptions(
    paginationOptions,
    'lastClickedAt',
  );

  const where = { userId };

  // Get total count
  const total = await prismaClient.categoryClick.count({ where });

  // Get category clicks with subcategory and category details
  const categoryClicks = await prismaClient.categoryClick.findMany({
    where,
    include: {
      subCategory: {
        include: {
          category: {
            select: { name: true },
          },
        },
        select: {
          name: true,
          category: true,
        },
      },
    },
    skip: calculateSkip(page, limit),
    take: limit,
    orderBy: { [sortBy]: sortOrder },
  });

  return createPaginatedResponse(categoryClicks, page, limit, total);
};
