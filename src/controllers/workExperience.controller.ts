import { Request, Response } from 'express';
import httpStatus from 'http-status';
import * as userService from '../services/user.service';
import * as workExperienceService from '../services/workExperience.service';
import catchAsync from '../utils/catchAsync';
import ApiError from '../utils/ApiError';
import { parsePaginationOptions } from '../utils/pagination';

// Helper to get user ID and profile ID, ensuring user is authenticated
const getProfileIdFromRequest = async (req: Request): Promise<string> => {
  if (!req.user?.id) {
    // This should technically be caught by auth middleware, but belts and braces
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Authentication required');
  }
  return userService.getUserProfileId(req.user.id);
};

export const createWorkExperience = catchAsync(
  async (req: Request, res: Response) => {
    const userProfileId = await getProfileIdFromRequest(req);
    const experience = await workExperienceService.createWorkExperience(
      userProfileId,
      req.body,
    );
    res.status(httpStatus.CREATED).send(experience);
  },
);

export const getMyWorkExperiences = catchAsync(
  async (req: Request, res: Response) => {
    const userProfileId = await getProfileIdFromRequest(req);
    const paginationOptions = parsePaginationOptions(req.query, 'startDate');
    const experiences =
      await workExperienceService.getWorkExperiencesByProfileId(
        userProfileId,
        paginationOptions,
      );
    res.send(experiences);
  },
);

export const getWorkExperience = catchAsync(
  async (req: Request, res: Response) => {
    const { workExperienceId } = req.params;
    if (!workExperienceId) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'Work Experience ID is required',
      );
    }
    const userProfileId = await getProfileIdFromRequest(req);
    const experience = await workExperienceService.getWorkExperienceById(
      userProfileId,
      workExperienceId,
    );
    res.send(experience);
  },
);

export const updateWorkExperience = catchAsync(
  async (req: Request, res: Response) => {
    const { workExperienceId } = req.params;
    if (!workExperienceId) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'Work Experience ID is required',
      );
    }
    const userProfileId = await getProfileIdFromRequest(req);
    const experience = await workExperienceService.updateWorkExperienceById(
      userProfileId,
      workExperienceId,
      req.body,
    );
    res.send(experience);
  },
);

export const deleteWorkExperience = catchAsync(
  async (req: Request, res: Response) => {
    const { workExperienceId } = req.params;
    if (!workExperienceId) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'Work Experience ID is required',
      );
    }
    const userProfileId = await getProfileIdFromRequest(req);
    await workExperienceService.deleteWorkExperienceById(
      userProfileId,
      workExperienceId,
    );
    res.status(httpStatus.NO_CONTENT).send();
  },
);
