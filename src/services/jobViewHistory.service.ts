import {
  JobViewHistory,
  Job,
  Company,
  ApprovalStatus,
  SubCategory,
  Category,
  Application,
} from '@prisma/client';
import prisma from '../config/prisma';
import {
  PaginationOptions,
  PaginatedResponse,
  parsePaginationOptionsLegacy,
  calculateSkip,
  createPaginatedResponse,
} from '../utils/pagination';
import ApiError from '../utils/ApiError';
import httpStatus from 'http-status';

/**
 * Create or update job view history entry
 * @param userId - User ID
 * @param jobId - Job ID
 * @returns Promise with job view history entry
 */
export const createJobView = async (
  userId: string,
  jobId: string,
): Promise<JobViewHistory> => {
  // Check if the user has already viewed this job
  const existingView = await prisma.jobViewHistory.findUnique({
    where: {
      userId_jobId: {
        userId,
        jobId,
      },
    },
  });

  if (existingView) {
    // Update existing view - increment view count and update timestamp
    return prisma.jobViewHistory.update({
      where: { id: existingView.id },
      data: {
        viewCount: existingView.viewCount + 1,
        lastViewedAt: new Date(),
      },
    });
  } else {
    // Create new view record
    return prisma.jobViewHistory.create({
      data: {
        userId,
        jobId,
        viewCount: 1,
        lastViewedAt: new Date(),
      },
    });
  }
};

/**
 * Get job view history for a user with pagination and job details
 * @param userId - User ID
 * @param paginationOptions - Pagination options
 * @returns Promise with paginated job view history
 */
export const getUserJobViewHistory = async (
  userId: string,
  paginationOptions: PaginationOptions = {},
): Promise<
  PaginatedResponse<
    JobViewHistory & {
      job: Job & {
        company: Company;
        subCategories: (SubCategory & { category: Category })[];
        _count: { applications: number };
      };
    }
  >
> => {
  const { page, limit, sortBy, sortOrder } = parsePaginationOptionsLegacy(
    paginationOptions,
    'lastViewedAt',
  );

  const where = {
    userId,
    job: {
      isArchived: false,
      approvalStatus: ApprovalStatus.APPROVED,
      company: {
        approvalStatus: ApprovalStatus.APPROVED,
      },
    },
  };

  // Get total count
  const total = await prisma.jobViewHistory.count({ where });

  // Get job view history with job details and pagination
  const jobViews = await prisma.jobViewHistory.findMany({
    where,
    include: {
      job: {
        include: {
          company: true,
          subCategories: {
            include: {
              category: true,
            },
          },
          _count: {
            select: { applications: true },
          },
        },
      },
    },
    skip: calculateSkip(page, limit),
    take: limit,
    orderBy: { [sortBy]: sortOrder },
  });

  return createPaginatedResponse(jobViews, page, limit, total);
};

/**
 * Get personalized job recommendations based on user's viewing history with pagination
 * This is a simplified recommendation system based on:
 * - Categories the user has viewed most
 * - Similar jobs to what they've viewed
 * @param userId - User ID
 * @param paginationOptions - Pagination options
 * @returns Promise with paginated recommended jobs
 */
export const getRecommendedJobs = async (
  userId: string,
  paginationOptions: PaginationOptions = {},
): Promise<
  PaginatedResponse<
    Job & {
      company: Company;
      subCategories: (SubCategory & { category: Category })[];
      _count: { applications: number };
    }
  >
> => {
  const { page, limit, sortBy, sortOrder } = parsePaginationOptionsLegacy(
    paginationOptions,
    'createdAt',
  );

  // Get user's most viewed categories
  const userViewHistory = await prisma.jobViewHistory.findMany({
    where: { userId },
    include: {
      job: {
        include: {
          subCategories: {
            include: {
              category: true,
            },
          },
        },
      },
    },
    orderBy: {
      viewCount: 'desc',
    },
    take: 20, // Get top 20 viewed jobs to analyze patterns
  });

  // Extract category IDs from viewed jobs
  const viewedCategoryIds = userViewHistory
    .flatMap((view) =>
      view.job.subCategories.map((subCat) => subCat.category.id),
    )
    .filter((id, index, array) => array.indexOf(id) === index); // Remove duplicates

  // Also get jobs the user has already viewed to exclude them
  const viewedJobIds = userViewHistory.map((view) => view.jobId);

  const where = {
    id: {
      notIn: viewedJobIds, // Exclude already viewed jobs
    },
    isArchived: false,
    approvalStatus: ApprovalStatus.APPROVED,
    company: {
      approvalStatus: ApprovalStatus.APPROVED,
    },
    subCategories: {
      some: {
        category: {
          id: {
            in: viewedCategoryIds.length > 0 ? viewedCategoryIds : undefined,
          },
        },
      },
    },
  };

  // Get total count
  const total = await prisma.job.count({ where });

  // Get recommended jobs with pagination
  const recommendedJobs = await prisma.job.findMany({
    where,
    include: {
      company: true,
      subCategories: {
        include: {
          category: true,
        },
      },
      _count: {
        select: { applications: true },
      },
    },
    skip: calculateSkip(page, limit),
    take: limit,
    orderBy: { [sortBy]: sortOrder },
  });

  return createPaginatedResponse(recommendedJobs, page, limit, total);
};
