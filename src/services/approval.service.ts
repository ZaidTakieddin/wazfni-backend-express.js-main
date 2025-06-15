import { Company, Job, ApprovalStatus } from '@prisma/client';
import httpStatus from 'http-status';
import prisma from '../config/prisma';
import ApiError from '../utils/ApiError';
import {
  NotificationService,
  NotificationTemplates,
} from './notification.service';

// Company Approval Services

/**
 * Get all companies pending approval
 */
export const getPendingCompanies = async () => {
  return prisma.company.findMany({
    where: { approvalStatus: ApprovalStatus.PENDING },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  });
};

/**
 * Get all companies (approved, pending, rejected) for admin dashboard
 */
export const getAllCompaniesForAdmin = async () => {
  return prisma.company.findMany({
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
};

/**
 * Approve a company
 */
export const approveCompany = async (
  companyId: string,
  adminId: string,
): Promise<Company> => {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
  });

  if (!company) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Company not found');
  }

  if (company.approvalStatus === ApprovalStatus.APPROVED) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Company is already approved');
  }

  const updatedCompany = await prisma.company.update({
    where: { id: companyId },
    data: {
      approvalStatus: ApprovalStatus.APPROVED,
      approvedAt: new Date(),
      approvedBy: adminId,
      reviewedAt: new Date(),
      rejectionReason: null, // Clear any previous rejection reason
    },
  });

  // Send notification to company owner about approval
  try {
    const notification = NotificationTemplates.companyApproved(
      updatedCompany.name || 'شركتك',
    );
    await NotificationService.sendToCompanyOwner(companyId, notification);
  } catch (error) {
    console.error('Failed to send company approval notification:', error);
  }

  return updatedCompany;
};

/**
 * Reject a company
 */
export const rejectCompany = async (
  companyId: string,
  adminId: string,
  rejectionReason: string,
): Promise<Company> => {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
  });

  if (!company) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Company not found');
  }

  if (company.approvalStatus === ApprovalStatus.APPROVED) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Cannot reject an already approved company',
    );
  }

  const updatedCompany = await prisma.company.update({
    where: { id: companyId },
    data: {
      approvalStatus: ApprovalStatus.REJECTED,
      approvedAt: null,
      approvedBy: adminId,
      reviewedAt: new Date(),
      rejectionReason,
    },
  });

  // Send notification to company owner about rejection
  try {
    const notification = NotificationTemplates.companyRejected(
      updatedCompany.name || 'شركتك',
      rejectionReason,
    );
    await NotificationService.sendToCompanyOwner(companyId, notification);
  } catch (error) {
    console.error('Failed to send company rejection notification:', error);
  }

  return updatedCompany;
};

// Job Approval Services

/**
 * Get all jobs pending approval
 */
export const getPendingJobs = async () => {
  return prisma.job.findMany({
    where: {
      approvalStatus: ApprovalStatus.PENDING,
      company: { approvalStatus: ApprovalStatus.APPROVED }, // Only show jobs from approved companies
    },
    include: {
      company: {
        select: {
          id: true,
          name: true,
          user: {
            select: { email: true },
          },
        },
      },
      subCategories: {
        include: {
          category: {
            select: { name: true },
          },
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  });
};

/**
 * Get all jobs (approved, pending, rejected) for admin dashboard
 */
export const getAllJobsForAdmin = async () => {
  return prisma.job.findMany({
    include: {
      company: {
        select: {
          id: true,
          name: true,
          user: {
            select: { email: true },
          },
        },
      },
      subCategories: {
        include: {
          category: {
            select: { name: true },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
};

/**
 * Approve a job
 */
export const approveJob = async (
  jobId: string,
  adminId: string,
): Promise<Job> => {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: { company: true },
  });

  if (!job) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Job not found');
  }

  if (job.company.approvalStatus !== ApprovalStatus.APPROVED) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Cannot approve jobs from companies that are not approved',
    );
  }

  if (job.approvalStatus === ApprovalStatus.APPROVED) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Job is already approved');
  }

  const updatedJob = await prisma.job.update({
    where: { id: jobId },
    data: {
      approvalStatus: ApprovalStatus.APPROVED,
      approvedAt: new Date(),
      approvedBy: adminId,
      reviewedAt: new Date(),
      rejectionReason: null, // Clear any previous rejection reason
    },
  });

  // Send notification to company owner about job approval
  try {
    const notification = NotificationTemplates.jobApproved(updatedJob.jobTitle);
    await NotificationService.sendToCompanyOwner(job.companyId, notification);
  } catch (error) {
    console.error('Failed to send job approval notification:', error);
  }

  // Send notifications to interested users based on job subcategories
  try {
    const jobWithSubcategories = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        subCategories: true,
        company: true,
      },
    });

    if (jobWithSubcategories && jobWithSubcategories.subCategories.length > 0) {
      const subCategoryIds = jobWithSubcategories.subCategories.map(
        (sc) => sc.id,
      );
      const notification = NotificationTemplates.recommendedJob(
        jobWithSubcategories.jobTitle,
        jobWithSubcategories.company.name || 'شركة غير محددة',
      );
      await NotificationService.sendToInterestedUsers(
        subCategoryIds,
        notification,
      );
    }
  } catch (error) {
    console.error('Failed to send job recommendation notifications:', error);
  }

  return updatedJob;
};

/**
 * Reject a job
 */
export const rejectJob = async (
  jobId: string,
  adminId: string,
  rejectionReason: string,
): Promise<Job> => {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: { company: true },
  });

  if (!job) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Job not found');
  }

  if (job.approvalStatus === ApprovalStatus.APPROVED) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Cannot reject an already approved job',
    );
  }

  const updatedJob = await prisma.job.update({
    where: { id: jobId },
    data: {
      approvalStatus: ApprovalStatus.REJECTED,
      approvedAt: null,
      approvedBy: adminId,
      reviewedAt: new Date(),
      rejectionReason,
    },
  });

  // Send notification to company owner about job rejection
  try {
    const notification = NotificationTemplates.jobRejected(
      updatedJob.jobTitle,
      rejectionReason,
    );
    await NotificationService.sendToCompanyOwner(job.companyId, notification);
  } catch (error) {
    console.error('Failed to send job rejection notification:', error);
  }

  return updatedJob;
};

/**
 * Get company by ID for approval review
 */
export const getCompanyForReview = async (companyId: string) => {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    include: {
      user: {
        select: {
          email: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  if (!company) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Company not found');
  }

  return company;
};

/**
 * Get job by ID for approval review
 */
export const getJobForReview = async (jobId: string) => {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: {
      company: {
        select: {
          id: true,
          name: true,
          user: {
            select: { email: true },
          },
        },
      },
      subCategories: {
        include: {
          category: {
            select: { name: true },
          },
        },
      },
    },
  });

  if (!job) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Job not found');
  }

  return job;
};
