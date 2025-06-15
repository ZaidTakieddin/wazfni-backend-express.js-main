import {
  Job,
  Prisma,
  WorkType,
  SalaryType,
  ApprovalStatus,
} from '@prisma/client';
import httpStatus from 'http-status';
import prisma from '../config/prisma';
import ApiError from '../utils/ApiError';
import {
  NotificationService,
  NotificationTemplates,
} from './notification.service';

// Interface for job creation input from the controller/validation
interface CreateJobInput
  extends Omit<Prisma.JobCreateInput, 'company' | 'subCategories'> {
  subCategoryIds: string[];
}

/**
 * Get all jobs.
 * @param userId - Optional user ID to check bookmark status
 * @returns A list of jobs with bookmark status if userId is provided
 */
export const getJobs = async (userId?: string) => {
  const jobs = await prisma.job.findMany({
    where: {
      isArchived: false,
      approvalStatus: ApprovalStatus.APPROVED,
      company: {
        approvalStatus: ApprovalStatus.APPROVED,
      },
    },
    include: {
      company: true,
      subCategories: {
        include: {
          category: true,
        },
      },
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
 * @param jobBody - Contains job details including subCategoryIds and contractType.
 * @returns The created job.
 */
export const createJob = async (
  companyId: string,
  jobBody: CreateJobInput,
): Promise<Job> => {
  // First, verify the company is approved
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { approvalStatus: true, name: true },
  });

  if (!company) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Company not found');
  }

  if (company.approvalStatus !== ApprovalStatus.APPROVED) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      'Only approved companies can create job postings. Please wait for admin approval.',
    );
  }

  const { subCategoryIds, ...jobData } = jobBody;

  // Normalize salary data based on salaryType
  let normalizedJobData = { ...jobData };

  if (jobData.salaryType === 'FIXED') {
    // For FIXED salary, set maxSalary to same as minSalary
    normalizedJobData.maxSalary = jobData.minSalary;
  } else if (jobData.salaryType === 'NONE') {
    // For NONE salary, set both to null
    normalizedJobData.minSalary = null;
    normalizedJobData.maxSalary = null;
  }
  // For RANGE, keep both values as provided

  // Validate subcategory IDs before proceeding
  if (subCategoryIds && subCategoryIds.length > 0) {
    const uniqueSubCategoryIds = [...new Set(subCategoryIds)]; // Ensure unique IDs
    const existingSubCategoriesCount = await prisma.subCategory.count({
      where: {
        id: {
          in: uniqueSubCategoryIds,
        },
      },
    });
    if (existingSubCategoriesCount !== uniqueSubCategoryIds.length) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'One or more provided subcategory IDs are invalid',
      );
    }
  }

  const job = await prisma.job.create({
    data: {
      ...normalizedJobData,
      company: {
        connect: { id: companyId }, // Connect to the company
      },
      subCategories: {
        // Connect subcategories by their IDs
        connect: subCategoryIds.map((id) => ({ id })),
      },
      // Job starts in PENDING status for admin approval
      approvalStatus: ApprovalStatus.PENDING,
    },
    include: {
      subCategories: {
        include: {
          category: true,
        },
      },
    }, // Include subcategories with their parent categories in the returned job
  });

  // Send notification to admins about new job for review
  try {
    const notification = NotificationTemplates.newJobForReview(
      job.jobTitle,
      company.name || 'شركة غير محددة',
    );
    await NotificationService.sendToAdmins(notification);
  } catch (error) {
    console.error('Failed to send admin notification for new job:', error);
    // Don't throw error, just log it as notification failure shouldn't break job creation
  }

  return job;
};

/**
 * Get all jobs posted by a specific company.
 * @param companyId - The ID of the company.
 * @param includeArchived - Whether to include archived jobs (default: false)
 * @returns A list of jobs.
 */
export const getJobsByCompanyId = async (
  companyId: string,
  includeArchived: boolean = false,
): Promise<(Job & { _count?: { applications: number } })[]> => {
  const jobs = await prisma.job.findMany({
    where: {
      companyId,
      ...(includeArchived ? {} : { isArchived: false }), // Exclude archived jobs unless explicitly requested
    },
    include: {
      subCategories: {
        include: {
          category: true,
        },
      }, // Include subcategories with parent categories
      _count: {
        // Add count of applications
        select: { applications: true, viewHistory: true },
      },
    },
    orderBy: { createdAt: 'desc' }, // Example ordering
  });
  return jobs;
};

/**
 * Get jobs by company ID and approval status
 * @param companyId - The ID of the company
 * @param approvalStatus - The approval status to filter by
 * @param includeArchived - Whether to include archived jobs (default: false)
 * @returns A list of jobs with the specified approval status
 */
export const getJobsByCompanyIdAndStatus = async (
  companyId: string,
  approvalStatus: ApprovalStatus,
  includeArchived: boolean = false,
): Promise<
  (Job & { _count?: { applications: number; viewHistory: number } })[]
> => {
  const jobs = await prisma.job.findMany({
    where: {
      companyId,
      approvalStatus,
      ...(includeArchived ? {} : { isArchived: false }),
    },
    include: {
      subCategories: {
        include: {
          category: true,
        },
      },
      _count: {
        select: { applications: true, viewHistory: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
  return jobs;
};

/**
 * Get pending jobs for a specific company
 * @param companyId - The ID of the company
 * @returns A list of pending jobs
 */
export const getPendingJobsByCompanyId = async (
  companyId: string,
): Promise<
  (Job & { _count?: { applications: number; viewHistory: number } })[]
> => {
  return getJobsByCompanyIdAndStatus(companyId, ApprovalStatus.PENDING);
};

/**
 * Get approved jobs for a specific company
 * @param companyId - The ID of the company
 * @returns A list of approved jobs
 */
export const getApprovedJobsByCompanyId = async (
  companyId: string,
): Promise<
  (Job & { _count?: { applications: number; viewHistory: number } })[]
> => {
  return getJobsByCompanyIdAndStatus(companyId, ApprovalStatus.APPROVED);
};

/**
 * Get rejected jobs for a specific company
 * @param companyId - The ID of the company
 * @returns A list of rejected jobs
 */
export const getRejectedJobsByCompanyId = async (
  companyId: string,
): Promise<
  (Job & { _count?: { applications: number; viewHistory: number } })[]
> => {
  return getJobsByCompanyIdAndStatus(companyId, ApprovalStatus.REJECTED);
};

/**
 * Get all archived jobs posted by a specific company.
 * @param companyId - The ID of the company.
 * @returns A list of archived jobs.
 */
export const getArchivedJobsByCompanyId = async (
  companyId: string,
): Promise<(Job & { _count?: { applications: number } })[]> => {
  const jobs = await prisma.job.findMany({
    where: {
      companyId,
      isArchived: true, // Only get archived jobs
    },
    include: {
      subCategories: {
        include: {
          category: true,
        },
      }, // Include subcategories with parent categories
      _count: {
        // Add count of applications
        select: { applications: true, viewHistory: true },
      },
    },
    orderBy: { updatedAt: 'desc' }, // Order by when they were archived (updated)
  });
  return jobs;
};

/**
 * Archive or unarchive a job posting.
 * @param jobId - The ID of the job to archive/unarchive.
 * @param companyId - The ID of the company that owns the job (for verification).
 * @param archive - Whether to archive (true) or unarchive (false) the job.
 * @returns The updated job.
 * @throws {ApiError} If the job is not found or doesn't belong to the company.
 */
export const archiveJob = async (
  jobId: string,
  companyId: string,
  archive: boolean = true,
): Promise<Job> => {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
  });

  if (!job) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Job not found');
  }

  if (job.companyId !== companyId) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      'Cannot modify job belonging to another company',
    );
  }

  const updatedJob = await prisma.job.update({
    where: { id: jobId },
    data: {
      isArchived: archive,
    },
    include: {
      subCategories: {
        include: {
          category: true,
        },
      },
    }, // Include subcategories with parent categories in the returned job
  });

  return updatedJob;
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
      subCategories: {
        include: {
          category: true,
        },
      },
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

  // For public access, only show approved jobs from approved companies
  if (
    job.approvalStatus !== ApprovalStatus.APPROVED ||
    job.company.approvalStatus !== ApprovalStatus.APPROVED
  ) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Job not found');
  }

  return {
    ...job,
    isBookmarked: userId ? job.bookmarks.length > 0 : undefined,
    bookmarks: undefined, // Remove the bookmarks array from response
  };
};

// Interface for job update input from the controller/validation
interface UpdateJobInput extends Omit<Prisma.JobUpdateInput, 'subCategories'> {
  subCategoryIds?: string[];
}

/**
 * Update a job posting.
 * @param jobId - The ID of the job to update.
 * @param companyId - The ID of the company that owns the job (for verification).
 * @param updateBody - Contains fields to update and optional subCategoryIds array.
 * @returns The updated job.
 * @throws {ApiError} If the job is not found or doesn't belong to the company.
 */
export const updateJob = async (
  jobId: string,
  companyId: string,
  updateBody: UpdateJobInput,
): Promise<Job> => {
  const { subCategoryIds, ...jobData } = updateBody;

  // Normalize salary data based on salaryType if provided
  let normalizedJobData = { ...jobData };

  if (jobData.salaryType === 'FIXED' && jobData.minSalary !== undefined) {
    // For FIXED salary, set maxSalary to same as minSalary
    normalizedJobData.maxSalary = jobData.minSalary;
  } else if (jobData.salaryType === 'NONE') {
    // For NONE salary, set both to null
    normalizedJobData.minSalary = null;
    normalizedJobData.maxSalary = null;
  }
  // For RANGE, keep both values as provided

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

  // Validate subcategory IDs if provided
  if (subCategoryIds && subCategoryIds.length > 0) {
    const uniqueSubCategoryIds = [...new Set(subCategoryIds)]; // Ensure unique IDs
    const existingSubCategoriesCount = await prisma.subCategory.count({
      where: {
        id: {
          in: uniqueSubCategoryIds,
        },
      },
    });
    if (existingSubCategoriesCount !== uniqueSubCategoryIds.length) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'One or more provided subcategory IDs are invalid',
      );
    }
  }

  const updatedJob = await prisma.job.update({
    where: { id: jobId },
    data: {
      ...normalizedJobData,
      // If subCategoryIds is provided, completely replace the existing subcategories
      // Otherwise, leave subcategories untouched
      ...(subCategoryIds && {
        subCategories: {
          set: subCategoryIds.map((id) => ({ id })),
        },
      }),
    },
    include: {
      subCategories: {
        include: {
          category: true,
        },
      },
    }, // Include subcategories with parent categories in the returned job
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
  subCategory?: string; // Filtering by subcategory name
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
): Promise<Job[]> => {
  const { searchTerm, title, city, subCategory, companyName, workType } =
    options;

  // Build the where clause dynamically
  let where: Prisma.JobWhereInput = {};
  let filterConditions: Prisma.JobWhereInput[] = [];

  // Text search across multiple fields
  if (searchTerm) {
    filterConditions.push({
      OR: [
        { jobTitle: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
        { requirements: { contains: searchTerm, mode: 'insensitive' } },
        {
          company: {
            name: { contains: searchTerm, mode: 'insensitive' },
          },
        },
      ],
    });
  }

  // Filter by job title
  if (title) {
    filterConditions.push({
      jobTitle: { contains: title, mode: 'insensitive' },
    });
  }

  // Filter by company location (city)
  if (city) {
    filterConditions.push({
      company: {
        city: { contains: city, mode: 'insensitive' },
      },
    });
  }

  // Filter by subcategory name
  if (subCategory) {
    filterConditions.push({
      subCategories: {
        some: {
          name: { contains: subCategory, mode: 'insensitive' },
        },
      },
    });
  }

  // Filter by company name
  if (companyName) {
    filterConditions.push({
      company: {
        name: { contains: companyName, mode: 'insensitive' },
      },
    });
  }

  // Filter by work type
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

  // Always exclude archived jobs and only show approved jobs from approved companies
  const baseConditions = [
    { isArchived: false },
    { approvalStatus: ApprovalStatus.APPROVED },
    { company: { approvalStatus: ApprovalStatus.APPROVED } },
  ];

  if (where.AND && Array.isArray(where.AND)) {
    where.AND.push(...baseConditions);
  } else if (where.AND) {
    where.AND = [where.AND as Prisma.JobWhereInput, ...baseConditions];
  } else {
    where.AND = baseConditions;
  }

  const jobs = await prisma.job.findMany({
    where,
    include: {
      subCategories: {
        include: {
          category: true,
        },
      }, // Include subcategories with parent categories
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
