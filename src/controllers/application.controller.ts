// src/controllers/application.controller.ts
import { Request, Response } from 'express';
import httpStatus from 'http-status';
// import { User } from '@prisma/client'; // No longer need direct import here
import * as applicationService from '../services/application.service'; // Use index
import catchAsync from '../utils/catchAsync';
import ApiError from '../utils/ApiError';

export const applyForJob = catchAsync(async (req: Request, res: Response) => {
  console.log('req.body', req.body);
  console.log('req.file', req.file);

  if (!req.user) {
    throw new ApiError(
      httpStatus.UNAUTHORIZED,
      'Authentication required to apply',
    );
  }
  const { jobId } = req.params;
  if (!jobId) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Job ID is required in URL parameters.',
    );
  }
  const applicantId = req.user.id;
  const { answers } = req.body;
  const uploadedCvPath = req.file?.path; // Path from uploadCv middleware

  if (!answers || !Array.isArray(answers)) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Answers must be provided as an array.',
    );
  }

  const application = await applicationService.createApplication(
    applicantId,
    jobId,
    answers,
    uploadedCvPath,
  );

  res.status(httpStatus.CREATED).send(application);
});

export const getJobApplications = catchAsync(
  async (req: Request, res: Response) => {
    // This route should be protected by auth and company ownership middleware
    if (!req.user) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Authentication required');
    }
    const companyUserId = req.user.id;
    const { jobId } = req.params;
    if (!jobId) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'Job ID is required in URL parameters.',
      );
    }

    const applications = await applicationService.getApplicationsForJob(
      companyUserId,
      jobId,
    );
    res.send(applications);
  },
);

export const getApplication = catchAsync(
  async (req: Request, res: Response) => {
    // Ensure user is authenticated (company check happens in service)
    if (!req.user) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Authentication required');
    }
    const companyUserId = req.user.id;
    const { applicationId } = req.params;
    if (!applicationId) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Application ID is required');
    }

    const application = await applicationService.getApplicationById(
      companyUserId,
      applicationId,
    );
    // Service throws 404 or 403 if not found or not authorized

    res.send(application);
  },
);

export const getMyApplications = catchAsync(
  async (req: Request, res: Response) => {
    if (!req.user) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Authentication required');
    }
    const applicantId = req.user.id;

    if (!applicantId) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Applicant ID is required');
    }

    const applications =
      await applicationService.getMyApplications(applicantId);
    res.send(applications);
  },
);

export const updateApplicationStatus = catchAsync(
  async (req: Request, res: Response) => {
    if (!req.user) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Authentication required');
    }
    const companyUserId = req.user.id;
    const { applicationId } = req.params;
    const { status } = req.body;

    if (!applicationId) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Application ID is required');
    }

    if (!status) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Status is required');
    }

    const updatedApplication = await applicationService.updateApplicationStatus(
      companyUserId,
      applicationId,
      status,
    );

    res.send({
      message: `Application status updated to ${status}`,
      application: updatedApplication,
    });
  },
);

// TODO: Add controllers for updating application status (e.g., by company)
