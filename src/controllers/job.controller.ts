import { Request, Response } from 'express';
import httpStatus from 'http-status';
import * as jobService from '../services/job.service';
import catchAsync from '../utils/catchAsync';
import ApiError from '../utils/ApiError';
import prisma from '../config/prisma'; // Needed to get companyId

export const getJobs = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id; // Optional user ID from auth
  const jobs = await jobService.getJobs(userId);
  res.send(jobs);
});

// Helper function to get companyId for the logged-in user
const getCompanyIdFromUser = async (userId: string): Promise<string> => {
  const company = await prisma.company.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!company) {
    // This check should be redundant if authorize(requireCompany=true) middleware is used,
    // but provides an extra layer of safety.
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'User is not associated with a company',
    );
  }
  return company.id;
};

export const createJobPost = catchAsync(async (req: Request, res: Response) => {
  if (!req.user)
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Authentication required');

  const companyId = await getCompanyIdFromUser(req.user.id);
  const job = await jobService.createJob(companyId, req.body);
  res.status(httpStatus.CREATED).send(job);
});

export const getMyCompanyJobs = catchAsync(
  async (req: Request, res: Response) => {
    if (!req.user)
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Authentication required');

    const companyId = await getCompanyIdFromUser(req.user.id);
    const jobs = await jobService.getJobsByCompanyId(companyId); // This now excludes archived jobs by default
    res.send(jobs);
  },
);

export const getMyCompanyArchivedJobs = catchAsync(
  async (req: Request, res: Response) => {
    if (!req.user)
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Authentication required');

    const companyId = await getCompanyIdFromUser(req.user.id);
    const archivedJobs = await jobService.getArchivedJobsByCompanyId(companyId);
    res.send(archivedJobs);
  },
);

export const getMyCompanyPendingJobs = catchAsync(
  async (req: Request, res: Response) => {
    if (!req.user)
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Authentication required');

    const companyId = await getCompanyIdFromUser(req.user.id);
    const pendingJobs = await jobService.getPendingJobsByCompanyId(companyId);
    res.send(pendingJobs);
  },
);

export const getMyCompanyApprovedJobs = catchAsync(
  async (req: Request, res: Response) => {
    if (!req.user)
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Authentication required');

    const companyId = await getCompanyIdFromUser(req.user.id);
    const approvedJobs = await jobService.getApprovedJobsByCompanyId(companyId);
    res.send(approvedJobs);
  },
);

export const getMyCompanyRejectedJobs = catchAsync(
  async (req: Request, res: Response) => {
    if (!req.user)
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Authentication required');

    const companyId = await getCompanyIdFromUser(req.user.id);
    const rejectedJobs = await jobService.getRejectedJobsByCompanyId(companyId);
    res.send(rejectedJobs);
  },
);

export const archiveJobPost = catchAsync(
  async (req: Request, res: Response) => {
    if (!req.user)
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Authentication required');

    // Add check for jobId param
    const jobId = req.params.jobId;
    if (typeof jobId !== 'string') {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'Job ID must be provided in URL parameters',
      );
    }

    const companyId = await getCompanyIdFromUser(req.user.id);
    const archivedJob = await jobService.archiveJob(jobId, companyId, true);
    res.send(archivedJob);
  },
);

export const unarchiveJobPost = catchAsync(
  async (req: Request, res: Response) => {
    if (!req.user)
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Authentication required');

    // Add check for jobId param
    const jobId = req.params.jobId;
    if (typeof jobId !== 'string') {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'Job ID must be provided in URL parameters',
      );
    }

    const companyId = await getCompanyIdFromUser(req.user.id);
    const unarchivedJob = await jobService.archiveJob(jobId, companyId, false);
    res.send(unarchivedJob);
  },
);

export const getJobPost = catchAsync(async (req: Request, res: Response) => {
  const { jobId } = req.params;
  const userId = req.user?.id; // Optional user ID from auth
  const job = await jobService.getJobById(jobId, userId);
  res.send(job);
});

export const updateJobPost = catchAsync(async (req: Request, res: Response) => {
  if (!req.user)
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Authentication required');

  // Add check for jobId param
  const jobId = req.params.jobId;
  if (typeof jobId !== 'string') {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Job ID must be provided in URL parameters',
    );
  }

  const companyId = await getCompanyIdFromUser(req.user.id);
  const job = await jobService.updateJob(jobId, companyId, req.body);
  res.send(job);
});

export const deleteJobPost = catchAsync(async (req: Request, res: Response) => {
  if (!req.user)
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Authentication required');

  // Add check for jobId param
  const jobId = req.params.jobId;
  if (typeof jobId !== 'string') {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Job ID must be provided in URL parameters',
    );
  }

  const companyId = await getCompanyIdFromUser(req.user.id);
  await jobService.deleteJob(jobId, companyId);
  res.status(httpStatus.NO_CONTENT).send();
});

// Public search endpoint
export const searchJobs = catchAsync(async (req: Request, res: Response) => {
  const {
    searchTerm,
    title,
    city,
    subCategory,
    subCategoryId,
    companyName,
    workType,
  } = req.query;

  const searchOptions = {
    searchTerm: searchTerm as string | undefined,
    title: title as string | undefined,
    city: city as string | undefined,
    subCategory: subCategory as string | undefined,
    subCategoryId: subCategoryId as string | undefined,
    companyName: companyName as string | undefined,
    workType: workType as string | undefined,
  };

  const jobs = await jobService.searchAndFilterJobs(searchOptions);
  res.send(jobs);
});

// TODO: Add controller for public job search/filtering
