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
    // req.user is attached by the auth middleware
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
      req.body,
      filePaths,
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

// ===== ADMIN USER MANAGEMENT CONTROLLERS =====

// Get all users with filtering and pagination (Admin only)
export const getAllUsers = catchAsync(async (req: Request, res: Response) => {
  const { page, limit, sortBy, sortOrder, role, isVerified, search } =
    req.query;

  const filters = {
    role: role as any,
    isVerified: isVerified as any,
    search: search as string,
  };

  const pagination = {
    page: page as any,
    limit: limit as any,
    sortBy: sortBy as any,
    sortOrder: sortOrder as any,
  };

  const result = await userService.getAllUsers(filters, pagination);
  res.send(result);
});

// Create a new user (Admin only)
export const createUser = catchAsync(async (req: Request, res: Response) => {
  const user = await userService.createUser(req.body);
  res.status(httpStatus.CREATED).send({
    message: 'User created successfully',
    user,
  });
});

// Update a user (Admin only)
export const updateUser = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.params;
  if (!userId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'User ID parameter is required');
  }
  const user = await userService.updateUser(userId, req.body);
  res.send({
    message: 'User updated successfully',
    user,
  });
});

// Delete a user (Admin only)
export const deleteUser = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.params;
  if (!userId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'User ID parameter is required');
  }
  await userService.deleteUser(userId);
  res.status(httpStatus.NO_CONTENT).send();
});

// Get detailed user information (Admin only)
export const getUserDetail = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.params;
  if (!userId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'User ID parameter is required');
  }

  // Get user with all related data
  const user = await userService.getUserById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  // Get user profile
  const profile = await userService.getUserProfile(userId);

  res.send({
    user,
    profile,
  });
});

// Get user statistics (Admin only)
export const getUserStatistics = catchAsync(
  async (req: Request, res: Response) => {
    const statistics = await userService.getUserStatistics();
    res.send(statistics);
  },
);
