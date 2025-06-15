import { PrismaClient } from '@prisma/client';
import ApiError from '../utils/ApiError';
import httpStatus from 'http-status';

const prisma = new PrismaClient();

export const recordCategoryClick = async (
  userId: string,
  subCategoryId: string,
) => {
  if (!subCategoryId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'SubCategory ID is required');
  }

  // Verify subcategory exists
  const subCategory = await prisma.subCategory.findUnique({
    where: { id: subCategoryId },
  });

  if (!subCategory) {
    throw new ApiError(httpStatus.NOT_FOUND, 'SubCategory not found');
  }

  const categoryClick = await prisma.categoryClick.upsert({
    where: {
      userId_subCategoryId: {
        userId,
        subCategoryId,
      },
    },
    update: {
      clickCount: {
        increment: 1,
      },
      lastClickedAt: new Date(),
    },
    create: {
      userId,
      subCategoryId,
      clickCount: 1,
      lastClickedAt: new Date(),
    },
    include: {
      subCategory: {
        include: {
          category: true,
        },
      },
    },
  });

  return categoryClick;
};

export const getUserCategoryClicks = async (userId: string) => {
  const categoryClicks = await prisma.categoryClick.findMany({
    where: { userId },
    include: {
      subCategory: {
        include: {
          category: true,
        },
      },
    },
    orderBy: {
      lastClickedAt: 'desc',
    },
  });

  return categoryClicks;
};
