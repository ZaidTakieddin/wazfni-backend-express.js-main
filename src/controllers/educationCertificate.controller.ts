import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../utils/catchAsync';
import ApiError from '../utils/ApiError';
import * as userService from '../services/user.service';
import * as educationCertificateService from '../services/educationCertificate.service';
import { parsePaginationOptions } from '../utils/pagination';

// Helper to get user ID and profile ID, ensuring user is authenticated
// (Could be moved to a shared utils file if used in more controllers)
const getProfileIdFromRequest = async (req: Request): Promise<string> => {
  if (!req.user?.id) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Authentication required');
  }
  return userService.getUserProfileId(req.user.id);
};

export const createEducationCertificate = catchAsync(
  async (req: Request, res: Response) => {
    const userProfileId = await getProfileIdFromRequest(req);
    const certificate =
      await educationCertificateService.createEducationCertificate(
        userProfileId,
        req.body,
      );
    res.status(httpStatus.CREATED).send(certificate);
  },
);

export const getMyEducationCertificates = catchAsync(
  async (req: Request, res: Response) => {
    const userProfileId = await getProfileIdFromRequest(req);
    const paginationOptions =
      parsePaginationOptions(req.query, 'startDate') || {};
    const certificates =
      await educationCertificateService.getUserEducationCertificates(
        userProfileId,
        paginationOptions,
      );
    res.send(certificates);
  },
);

export const getEducationCertificate = catchAsync(
  async (req: Request, res: Response) => {
    const { certificateId } = req.params;
    if (!certificateId) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Certificate ID is required');
    }
    const userProfileId = await getProfileIdFromRequest(req);
    const certificate =
      await educationCertificateService.getEducationCertificateById(
        userProfileId,
        certificateId,
      );
    res.send(certificate);
  },
);

export const updateEducationCertificate = catchAsync(
  async (req: Request, res: Response) => {
    const { certificateId } = req.params;
    if (!certificateId) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Certificate ID is required');
    }
    const userProfileId = await getProfileIdFromRequest(req);
    const certificate =
      await educationCertificateService.updateEducationCertificateById(
        userProfileId,
        certificateId,
        req.body,
      );
    res.send(certificate);
  },
);

export const deleteEducationCertificate = catchAsync(
  async (req: Request, res: Response) => {
    const { certificateId } = req.params;
    if (!certificateId) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Certificate ID is required');
    }
    const userProfileId = await getProfileIdFromRequest(req);
    await educationCertificateService.deleteEducationCertificateById(
      userProfileId,
      certificateId,
    );
    res.status(httpStatus.NO_CONTENT).send();
  },
);
