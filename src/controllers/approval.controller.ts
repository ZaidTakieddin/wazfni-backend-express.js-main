import { Request, Response } from 'express';
import httpStatus from 'http-status';
import * as approvalService from '../services/approval.service';
import catchAsync from '../utils/catchAsync';
import ApiError from '../utils/ApiError';

// Company Approval Controllers

export const getPendingCompanies = catchAsync(
  async (req: Request, res: Response) => {
    const companies = await approvalService.getPendingCompanies();
    res.send(companies);
  },
);

export const getAllCompaniesForAdmin = catchAsync(
  async (req: Request, res: Response) => {
    const companies = await approvalService.getAllCompaniesForAdmin();
    res.send(companies);
  },
);

export const getCompanyForReview = catchAsync(
  async (req: Request, res: Response) => {
    const { companyId } = req.params;
    if (!companyId) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Company ID is required');
    }
    const company = await approvalService.getCompanyForReview(companyId);
    res.send(company);
  },
);

export const approveCompany = catchAsync(
  async (req: Request, res: Response) => {
    if (!req.user) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Authentication required');
    }

    const { companyId } = req.params;
    if (!companyId) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Company ID is required');
    }

    const company = await approvalService.approveCompany(
      companyId,
      req.user.id,
    );
    res.send(company);
  },
);

export const rejectCompany = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Authentication required');
  }

  const { companyId } = req.params;
  const { rejectionReason } = req.body;

  if (!companyId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Company ID is required');
  }

  if (!rejectionReason) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Rejection reason is required');
  }

  const company = await approvalService.rejectCompany(
    companyId,
    req.user.id,
    rejectionReason,
  );
  res.send(company);
});

// Job Approval Controllers

export const getPendingJobs = catchAsync(
  async (req: Request, res: Response) => {
    const jobs = await approvalService.getPendingJobs();
    res.send(jobs);
  },
);

export const getAllJobsForAdmin = catchAsync(
  async (req: Request, res: Response) => {
    const jobs = await approvalService.getAllJobsForAdmin();
    res.send(jobs);
  },
);

export const getJobForReview = catchAsync(
  async (req: Request, res: Response) => {
    const { jobId } = req.params;
    if (!jobId) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Job ID is required');
    }
    const job = await approvalService.getJobForReview(jobId);
    res.send(job);
  },
);

export const approveJob = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Authentication required');
  }

  const { jobId } = req.params;
  if (!jobId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Job ID is required');
  }

  const job = await approvalService.approveJob(jobId, req.user.id);
  res.send(job);
});

export const rejectJob = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Authentication required');
  }

  const { jobId } = req.params;
  const { rejectionReason } = req.body;

  if (!jobId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Job ID is required');
  }

  if (!rejectionReason) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Rejection reason is required');
  }

  const job = await approvalService.rejectJob(
    jobId,
    req.user.id,
    rejectionReason,
  );
  res.send(job);
});
