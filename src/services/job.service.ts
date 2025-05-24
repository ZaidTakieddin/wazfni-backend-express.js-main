import { Job, Prisma, WorkType } from '@prisma/client';
import httpStatus from 'http-status';
import prisma from '../config/prisma';
import ApiError from '../utils/ApiError';

// Interface for job creation input from the controller/validation
interface CreateJobInput
  extends Omit<Prisma.JobCreateInput, 'company' | 'categories'> {
  categoryIds: string[];
}

/**
 * Get all jobs.
 * @param userId - Optional user ID to check bookmark status
 * @returns A list of jobs with bookmark status if userId is provided
 */
export const getJobs = async (userId?: string) => {
  const jobs = await prisma.job.findMany({
    include: {
      company: true,
      categories: true,
      bookmarks: userId
        ? {
            where: { userId },
            select: { id: true },
          }
        : undefined,
    },
  });

  return jobs.map((job) => ({
    ...job,
    isBookmarked: userId ? job.bookmarks.length > 0 : undefined,
    bookmarks: undefined, // Remove the bookmarks array from response
  }));
};

/**
 * Create a job posting for a specific company.
 * @param companyId - The ID of the company posting the job.
 * @param jobBody - Contains job details including categoryIds and contractType.
 * @returns The created job.
 */
export const createJob = async (
  companyId: string,
  jobBody: CreateJobInput,
): Promise<Job> => {
  const { categoryIds, ...jobData } = jobBody;

  // // Ensure company exists (optional check, DB constraint handles it mostly)
  // const companyExists = await prisma.company.findUnique({ where: { id: companyId } });
  // if (!companyExists) {
  //   throw new ApiError(httpStatus.BAD_REQUEST, 'Company not found');
  // }

  // Validate category IDs before proceeding
  if (categoryIds && categoryIds.length > 0) {
    const uniqueCategoryIds = [...new Set(categoryIds)]; // Ensure unique IDs
    const existingCategoriesCount = await prisma.category.count({
      where: {
        id: {
          in: uniqueCategoryIds,
        },
      },
    });
    if (existingCategoriesCount !== uniqueCategoryIds.length) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'One or more provided category IDs are invalid',
      );
    }
  }

  const job = await prisma.job.create({
    data: {
      ...jobData,
      company: {
        connect: { id: companyId }, // Connect to the company
      },
      categories: {
        // Connect categories by their IDs
        connect: categoryIds.map((id) => ({ id })),
      },
    },
    include: { categories: true }, // Include categories in the returned job
  });
  return job;
};

/**
 * Get all jobs posted by a specific company.
 * @param companyId - The ID of the company.
 * @returns A list of jobs.
 */
export const getJobsByCompanyId = async (
  companyId: string,
  // Adjust return type
): Promise<(Job & { _count?: { applications: number } })[]> => {
  const jobs = await prisma.job.findMany({
    where: { companyId },
    include: {
      categories: true, // Include categories
      _count: {
        // Add count of applications
        select: { applications: true },
      },
    },
    orderBy: { createdAt: 'desc' }, // Example ordering
  });
  return jobs;
};

/**
 * Get a specific job by its ID.
 * @param jobId - The ID of the job.
 * @param userId - Optional user ID to check bookmark status
 * @returns The job details with bookmark status if userId is provided
 * @throws {ApiError} If the job is not found.
 */
export const getJobById = async (jobId?: string, userId?: string) => {
  if (!jobId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Job ID is required');
  }

  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: {
      categories: true,
      company: true,
      _count: {
        select: { applications: true },
      },
      bookmarks: userId
        ? {
            where: { userId },
            select: { id: true },
          }
        : undefined,
    },
  });

  if (!job) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Job not found');
  }

  return {
    ...job,
    isBookmarked: userId ? job.bookmarks.length > 0 : undefined,
    bookmarks: undefined, // Remove the bookmarks array from response
  };
};

// Interface for job update input from the controller/validation
interface UpdateJobInput extends Omit<Prisma.JobUpdateInput, 'categories'> {
  categoryIds?: string[];
}

/**
 * Update a job posting.
 * @param jobId - The ID of the job to update.
 * @param companyId - The ID of the company that owns the job (for verification).
 * @param updateBody - Contains fields to update and optional categoryIds array.
 * @returns The updated job.
 * @throws {ApiError} If the job is not found or doesn't belong to the company.
 */
export const updateJob = async (
  jobId: string,
  companyId: string,
  updateBody: UpdateJobInput,
): Promise<Job> => {
  const { categoryIds, ...jobData } = updateBody;

  const job = await prisma.job.findUnique({
    where: { id: jobId },
  });

  if (!job) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Job not found');
  }

  if (job.companyId !== companyId) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      'Cannot update job belonging to another company',
    );
  }

  // Validate category IDs if provided
  if (categoryIds && categoryIds.length > 0) {
    const uniqueCategoryIds = [...new Set(categoryIds)]; // Ensure unique IDs
    const existingCategoriesCount = await prisma.category.count({
      where: {
        id: {
          in: uniqueCategoryIds,
        },
      },
    });
    if (existingCategoriesCount !== uniqueCategoryIds.length) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'One or more provided category IDs are invalid',
      );
    }
  }

  const updatedJob = await prisma.job.update({
    where: { id: jobId },
    data: {
      ...jobData,
      // If categoryIds is provided, completely replace the existing categories
      // Otherwise, leave categories untouched
      ...(categoryIds && {
        categories: {
          set: categoryIds.map((id) => ({ id })),
        },
      }),
    },
    include: { categories: true }, // Include categories in the returned job
  });
  return updatedJob;
};

/**
 * Delete a job posting.
 * @param jobId - The ID of the job to delete.
 * @param companyId - The ID of the company that owns the job (for verification).
 * @throws {ApiError} If the job is not found or doesn't belong to the company.
 */
export const deleteJob = async (
  jobId: string,
  companyId: string,
): Promise<void> => {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
  });

  if (!job) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Job not found');
  }

  if (job.companyId !== companyId) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      'Cannot delete job belonging to another company',
    );
  }

  await prisma.job.delete({ where: { id: jobId } });
};

// Interface for search options
interface SearchOptions {
  searchTerm?: string;
  title?: string;
  city?: string;
  category?: string; // Assuming filtering by category name for simplicity
  companyName?: string;
  workType?: string;
}

/**
 * Search and filter jobs based on various criteria.
 * @param options - Search and filter parameters.
 * @returns A list of matching jobs.
 */
export const searchAndFilterJobs = async (
  options: SearchOptions,
  // Adjust return type
): Promise<(Job & { _count?: { applications: number } })[]> => {
  const { title, city, category, companyName, workType } = options;

  // Check if any search or filter criteria were actually provided
  // If not, return an empty array immediately
  const hasCriteria = title || city || category || companyName || workType;
  if (!hasCriteria) {
    return [];
  }

  const where: Prisma.JobWhereInput = {};
  const filterConditions: Prisma.JobWhereInput[] = [];

  // --- Search Logic ---
  const searchConditions: Prisma.JobWhereInput[] = [];

  // Specific title search (can be combined with general search or used alone)
  if (title) {
    searchConditions.push({
      jobTitle: {
        contains: title,
        mode: 'insensitive',
      },
    });
  }

  // Combine search conditions with OR
  if (searchConditions.length > 0) {
    filterConditions.push({ OR: searchConditions });
  }

  // --- Filter Logic ---
  if (city) {
    filterConditions.push({
      company: {
        city: {
          contains: city,
          mode: 'insensitive',
        },
      },
    });
  }
  if (category) {
    filterConditions.push({
      categories: {
        some: {
          name: {
            contains: category,
            mode: 'insensitive',
          },
        },
      },
    });
  }
  if (companyName) {
    filterConditions.push({
      company: {
        name: {
          contains: companyName,
          mode: 'insensitive',
        },
      },
    });
  }
  if (workType) {
    // Split the workType string into an array and handle multiple values
    const workTypeValues = workType
      .split(',')
      .map((type) => type.trim().toUpperCase());

    // Validate each workType value
    const validWorkTypes = workTypeValues.filter((type) =>
      Object.values(WorkType).includes(type as WorkType),
    );

    if (validWorkTypes.length > 0) {
      filterConditions.push({
        workType: {
          in: validWorkTypes as WorkType[],
        },
      });
    } else {
      // If none of the provided workTypes are valid, return no results
      console.warn(
        `Invalid workType query parameters received: ${workType}. Returning empty results.`,
      );
      return []; // Return empty array immediately
    }
  }

  // Combine all filter conditions with AND
  if (filterConditions.length > 0) {
    where.AND = filterConditions;
  }

  const jobs = await prisma.job.findMany({
    where,
    include: {
      categories: true, // Include categories
      company: true, // Include company details
      _count: {
        // Add count of applications
        select: { applications: true },
      },
    },
    orderBy: {
      createdAt: 'desc', // Example ordering
    },
  });

  return jobs;
};
