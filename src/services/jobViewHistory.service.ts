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
    where: {
      userId,
      job: {
        isArchived: false,
      },
    },
    include: {
      job: {
        include: {
          company: true,
          categories: true,
          bookmarks: {
            where: {
              userId,
            },
          },
        },
      },
    },
    orderBy: {
      lastViewedAt: 'desc',
    },
  });

  return jobViews.map((jobView) => ({
    ...jobView,
    job: {
      ...jobView.job,
      isBookmarked: userId ? jobView.job.bookmarks.length > 0 : undefined,
      bookmarks: undefined, // Remove the bookmarks array from response
    },
  }));
};

export const getRecommendedJobs = async (userId: string) => {
  const recommendedJobs = await prisma.job.findMany({
    where: {
      isArchived: false,
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
      bookmarks: {
        where: {
          userId,
        },
      },
    },
    orderBy: {
      viewHistory: {
        _count: 'desc',
      },
    },
    take: 10,
  });

  return recommendedJobs.map((job) => ({
    ...job,
    isBookmarked: userId ? job.bookmarks.length > 0 : undefined,
    bookmarks: undefined, // Remove the bookmarks array from response
  }));
};
