import { PrismaClient } from '@prisma/client';
import ApiError from '../utils/ApiError';
import httpStatus from 'http-status';

const prisma = new PrismaClient();

export const recordJobView = async (userId: string, jobId: string) => {
  if (!jobId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Job ID is required');
  }

  const jobView = await prisma.jobViewHistory.upsert({
    where: {
      userId_jobId: {
        userId,
        jobId,
      },
    },
    update: {
      viewCount: {
        increment: 1,
      },
      lastViewedAt: new Date(),
    },
    create: {
      userId,
      jobId,
      viewCount: 1,
      lastViewedAt: new Date(),
    },
  });

  return jobView;
};

export const getUserJobViews = async (userId: string) => {
  const jobViews = await prisma.jobViewHistory.findMany({
    where: { userId },
    include: {
      job: {
        include: {
          company: true,
          categories: true,
        },
      },
    },
    orderBy: {
      lastViewedAt: 'desc',
    },
  });

  return jobViews;
};

export const getRecommendedJobs = async (userId: string) => {
  const recommendedJobs = await prisma.job.findMany({
    where: {
      categories: {
        some: {
          clicks: {
            some: {
              userId,
            },
          },
        },
      },
    },
    include: {
      company: true,
      categories: true,
    },
    orderBy: {
      viewHistory: {
        _count: 'desc',
      },
    },
    take: 10,
  });

  return recommendedJobs;
};
