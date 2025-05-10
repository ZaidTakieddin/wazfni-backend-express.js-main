import { Request, Response } from 'express';
import httpStatus from 'http-status';
import * as userService from '../services/user.service';
import catchAsync from '../utils/catchAsync';
import ApiError from '../utils/ApiError';

// Get the profile of the currently logged-in user
export const getMyProfile = catchAsync(async (req: Request, res: Response) => {
  // req.user is attached by the auth middleware
  if (!req.user) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Authentication required');
  }
  const profile = await userService.getUserProfile(req.user.id);
  res.send(profile);
});

// Update the profile of the currently logged-in user
export const updateMyProfile = catchAsync(
  async (req: Request, res: Response) => {
    if (!req.user) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Authentication required');
    }

    // Extract file paths from req.files if using uploadProfileFiles
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const filePaths: { cv?: string; avatar?: string } = {};
    if (files?.cv?.[0]) {
      filePaths.cv = files.cv[0].path;
    }
    if (files?.avatar?.[0]) {
      filePaths.avatar = files.avatar[0].path;
    }

    const updatedProfile = await userService.updateUserProfile(
      req.user.id,
      req.body, // Contains text fields
      filePaths, // Pass extracted file paths
    );
    res.send(updatedProfile);
  },
);

// Get a specific user by ID (Admin action usually)
export const getUser = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.params;
  if (!userId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'User ID parameter is required');
  }
  const user = await userService.getUserById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  res.send(user);
});

// Get a specific user's profile by User ID
export const getUserProfileById = catchAsync(
  async (req: Request, res: Response) => {
    const { userId } = req.params;
    if (!userId) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'User ID parameter is required',
      );
    }
    // Reuse the existing service function
    const profile = await userService.getUserProfile(userId);
    // getUserProfile handles creation or fetching, but if it absolutely must exist:
    if (!profile) {
      // This case might be redundant if getUserProfile always creates/returns one
      // or if the User must exist for the route to be hit.
      throw new ApiError(
        httpStatus.NOT_FOUND,
        'Profile not found for this user',
      );
    }
    res.send(profile);
  },
);

// In the future, you might add controllers for admins to manage other users:
// export const getUser = catchAsync(async (req: Request, res: Response) => { ... });
// export const updateUser = catchAsync(async (req: Request, res: Response) => { ... });
// export const deleteUser = catchAsync(async (req: Request, res: Response) => { ... });
