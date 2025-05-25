import { PrismaClient } from '@prisma/client';
import ApiError from '../utils/ApiError';
import httpStatus from 'http-status';

const prisma = new PrismaClient();

export const recordCategoryClick = async (
  userId: string,
  categoryId: string,
) => {
  if (!categoryId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Category ID is required');
  }

  const categoryClick = await prisma.categoryClick.upsert({
    where: {
      userId_categoryId: {
        userId,
        categoryId,
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
      categoryId,
      clickCount: 1,
      lastClickedAt: new Date(),
    },
  });

  return categoryClick;
};

export const getUserCategoryClicks = async (userId: string) => {
  const categoryClicks = await prisma.categoryClick.findMany({
    where: { userId },
    include: {
      category: true,
    },
    orderBy: {
      lastClickedAt: 'desc',
    },
  });

  return categoryClicks;
};
