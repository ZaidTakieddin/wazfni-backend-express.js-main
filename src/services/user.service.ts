import { Prisma, User, UserProfile, Role } from '@prisma/client';
import httpStatus from 'http-status';
import bcrypt from 'bcryptjs';
import prisma from '../config/prisma';
import {
  getRelativePath,
  deleteFileByRelativePath,
} from '../middlewares/upload'; // Import helper
import ApiError from '../utils/ApiError';

// Type for the data coming from the validated request body for profile update
// We define it here because we need to handle the date conversion
type UpdateProfileInput = Omit<
  Partial<UserProfile>,
  'birthDate' | 'cv' | 'avatar' // Exclude originals
> & {
  birthDate?: string; // Accept string from validation
  cv?: string; // Accept path string
  avatar?: string; // Accept path string
};

// Type for creating a new user (admin only)
type CreateUserInput = {
  email: string;
  password?: string;
  role?: Role;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  isVerified?: boolean;
};

// Type for updating a user (admin only)
type UpdateUserInput = {
  email?: string;
  password?: string;
  role?: Role;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  isVerified?: boolean;
};

// Type for user search filters
type UserFilters = {
  role?: Role;
  isVerified?: boolean;
  search?: string; // Search by email, firstName, or lastName
};

// Type for pagination
type PaginationOptions = {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
};

/**
 * Get user profile by user ID.
 * Creates a profile if one doesn't exist.
 * @param userId
 * @returns
 */
export const getUserProfile = async (userId: string): Promise<UserProfile> => {
  let profile = await prisma.userProfile.findUnique({
    where: { userId },
    // Include the related data when fetching the profile
    include: {
      workExperiences: {
        orderBy: { startDate: 'desc' }, // Optional: order included data
      },
      educationCertificates: {
        orderBy: { startDate: 'desc' }, // Optional: order included data
      },
    },
  });

  if (!profile) {
    // Optionally create a profile if it doesn't exist upon first access
    // If created here, the included relations will be empty arrays
    profile = await prisma.userProfile.create({
      data: { userId },
      include: {
        workExperiences: true,
        educationCertificates: true,
      },
    });
    // Consider if creating an empty profile is the desired behavior
    // or if it should only be created via an explicit update/create endpoint.
  }

  // Could throw an error if profile is still null, but creation logic handles this.
  // if (!profile) {
  //   throw new ApiError(httpStatus.NOT_FOUND, 'Profile not found');
  // }

  return profile;
};

/**
 * Update user profile by user ID.
 * @param userId
 * @param updateBody - Validated request body data.
 * @param filePaths - File paths from controller
 * @returns
 */
export const updateUserProfile = async (
  userId: string,
  updateBody: UpdateProfileInput,
  // Add file paths from controller
  filePaths: { cv?: string; avatar?: string } = {},
): Promise<UserProfile> => {
  // Get current profile to check for existing files
  const currentProfile = await prisma.userProfile.findUnique({
    where: { userId },
    select: { cv: true, avatar: true }, // Only select file fields for efficiency
  });

  const { birthDate, ...restOfBody } = updateBody;

  // Handle file replacements
  let shouldDeleteOldCv = false;
  let shouldDeleteOldAvatar = false;
  let oldCvPath: string | null = null;
  let oldAvatarPath: string | null = null;

  // Get relative paths if provided
  const relativeCvPath = filePaths.cv
    ? getRelativePath(filePaths.cv)
    : undefined;
  const relativeAvatarPath = filePaths.avatar
    ? getRelativePath(filePaths.avatar)
    : undefined;

  // Check if we need to delete old files
  if (currentProfile) {
    if (
      relativeCvPath &&
      currentProfile.cv &&
      currentProfile.cv !== relativeCvPath
    ) {
      shouldDeleteOldCv = true;
      oldCvPath = currentProfile.cv;
    }
    if (
      relativeAvatarPath &&
      currentProfile.avatar &&
      currentProfile.avatar !== relativeAvatarPath
    ) {
      shouldDeleteOldAvatar = true;
      oldAvatarPath = currentProfile.avatar;
    }
  }

  // Prepare data for Prisma, converting birthDate and adding file paths
  const dataForUpdate: Prisma.UserProfileUpdateInput = {
    ...restOfBody,
    ...(birthDate && { birthDate: new Date(birthDate) }),
    ...(relativeCvPath && { cv: relativeCvPath }), // Add relative CV path if present
    ...(relativeAvatarPath && { avatar: relativeAvatarPath }), // Add relative avatar path if present
  };

  // Data for the create part of upsert
  const dataForCreate: Prisma.UserProfileUncheckedCreateInput = {
    userId,
    ...restOfBody,
    ...(birthDate && { birthDate: new Date(birthDate) }),
    ...(relativeCvPath && { cv: relativeCvPath }),
    ...(relativeAvatarPath && { avatar: relativeAvatarPath }),
  };

  const updatedProfile = await prisma.userProfile.upsert({
    where: { userId },
    create: dataForCreate,
    update: dataForUpdate,
    // Include relations to return the full profile
    include: {
      workExperiences: { orderBy: { startDate: 'desc' } },
      educationCertificates: { orderBy: { startDate: 'desc' } },
    },
  });

  // Delete old files after successful database update
  if (shouldDeleteOldCv && oldCvPath) {
    const deleted = deleteFileByRelativePath(oldCvPath);
    if (deleted) {
      console.log(`Successfully deleted old CV: ${oldCvPath}`);
    } else {
      console.warn(
        `Failed to delete old CV: ${oldCvPath} (file may not exist)`,
      );
    }
  }

  if (shouldDeleteOldAvatar && oldAvatarPath) {
    const deleted = deleteFileByRelativePath(oldAvatarPath);
    if (deleted) {
      console.log(`Successfully deleted old avatar: ${oldAvatarPath}`);
    } else {
      console.warn(
        `Failed to delete old avatar: ${oldAvatarPath} (file may not exist)`,
      );
    }
  }

  return updatedProfile;
};

/**
 * Get user profile ID associated with a user ID.
 * Throws an error if the profile doesn't exist.
 * @param userId
 * @returns {Promise<string>} The userProfileId.
 * @throws {ApiError} If profile is not found.
 */
export const getUserProfileId = async (userId: string): Promise<string> => {
  const profile = await prisma.userProfile.findUnique({
    where: { userId },
    select: { id: true }, // Only select the ID
  });

  if (!profile) {
    // Depending on context, you might create one here, but for adding
    // work/education, the profile should likely already exist.
    throw new ApiError(httpStatus.NOT_FOUND, 'User profile not found.');
  }

  return profile.id;
};

/**
 * Get user by ID, including profile information.
 * Excludes password hash.
 * @param userId
 * @returns {Promise<Omit<User, 'passwordHash'> | null>}
 */
export const getUserById = async (
  userId: string,
): Promise<Omit<User, 'passwordHash'> | null> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return null; // Or throw ApiError(httpStatus.NOT_FOUND, 'User not found') if preferred
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

// ===== ADMIN USER MANAGEMENT FUNCTIONS =====

/**
 * Get all users with filtering and pagination (Admin only)
 * @param filters - User filters
 * @param pagination - Pagination options
 * @returns Promise with users and pagination info
 */
export const getAllUsers = async (
  filters: UserFilters = {},
  pagination: PaginationOptions = {},
) => {
  const {
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = pagination;
  const { role, isVerified, search } = filters;

  // Build where clause
  const where: Prisma.UserWhereInput = {};

  if (role) {
    where.role = role;
  }

  if (typeof isVerified === 'boolean') {
    where.isVerified = isVerified;
  }

  if (search) {
    where.OR = [
      { email: { contains: search, mode: 'insensitive' } },
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
    ];
  }

  // Calculate pagination
  const skip = (page - 1) * limit;

  // Get total count
  const total = await prisma.user.count({ where });

  // Get users
  const users = await prisma.user.findMany({
    where,
    select: {
      id: true,
      email: true,
      role: true,
      isVerified: true,
      lastLogin: true,
      firstName: true,
      lastName: true,
      phoneNumber: true,
      createdAt: true,
      updatedAt: true,
      // Include profile data
      profile: {
        select: {
          firstName: true,
          lastName: true,
          jobTitle: true,
          city: true,
          avatar: true,
        },
      },
      // Include company data for company users
      company: {
        select: {
          id: true,
          name: true,
          workField: true,
          approvalStatus: true,
        },
      },
      // Include some stats
      _count: {
        select: {
          applications: true,
          bookmarks: true,
        },
      },
    },
    skip,
    take: limit,
    orderBy: { [sortBy]: sortOrder },
  });

  return {
    users,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

/**
 * Create a new user (Admin only)
 * @param userData - User creation data
 * @returns Promise with created user (without password)
 */
export const createUser = async (
  userData: CreateUserInput,
): Promise<Omit<User, 'passwordHash'>> => {
  const { email, password, role = Role.USER, ...otherData } = userData;

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'User already exists');
  }

  // Hash password if provided
  let passwordHash: string | undefined;
  if (password) {
    passwordHash = await bcrypt.hash(password, 10);
  }

  // Create user
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      role,
      ...otherData,
    },
  });

  // Return user without password
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

/**
 * Update a user (Admin only)
 * @param userId - User ID to update
 * @param updateData - Data to update
 * @returns Promise with updated user (without password)
 */
export const updateUser = async (
  userId: string,
  updateData: UpdateUserInput,
): Promise<Omit<User, 'passwordHash'>> => {
  const { email, password, ...otherData } = updateData;

  // Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!existingUser) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  // Check email uniqueness if changing email
  if (email && email !== existingUser.email) {
    const emailExists = await prisma.user.findUnique({
      where: { email },
    });

    if (emailExists) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Email already in use');
    }
  }

  // Hash password if provided
  let passwordHash: string | undefined;
  if (password) {
    passwordHash = await bcrypt.hash(password, 10);
  }

  // Update user
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(email && { email }),
      ...(passwordHash && { passwordHash }),
      ...otherData,
    },
  });

  // Return user without password
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

/**
 * Delete a user (Admin only)
 * @param userId - User ID to delete
 * @returns Promise with deletion result
 */
export const deleteUser = async (userId: string): Promise<void> => {
  // Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: true,
      company: true,
    },
  });

  if (!existingUser) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  // Delete associated files if they exist
  if (existingUser.profile?.cv) {
    deleteFileByRelativePath(existingUser.profile.cv);
  }
  if (existingUser.profile?.avatar) {
    deleteFileByRelativePath(existingUser.profile.avatar);
  }
  if (existingUser.company?.logo) {
    deleteFileByRelativePath(existingUser.company.logo);
  }

  // Delete user (this will cascade delete related records)
  await prisma.user.delete({
    where: { id: userId },
  });
};

/**
 * Get user statistics (Admin only)
 * @returns Promise with user statistics
 */
export const getUserStatistics = async () => {
  const [
    totalUsers,
    verifiedUsers,
    adminUsers,
    regularUsers,
    usersWithCompanies,
    recentUsers,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { isVerified: true } }),
    prisma.user.count({ where: { role: Role.ADMIN } }),
    prisma.user.count({ where: { role: Role.USER } }),
    prisma.user.count({
      where: {
        company: {
          isNot: null,
        },
      },
    }),
    prisma.user.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        },
      },
    }),
  ]);

  return {
    totalUsers,
    verifiedUsers,
    unverifiedUsers: totalUsers - verifiedUsers,
    adminUsers,
    regularUsers,
    usersWithCompanies,
    usersWithoutCompanies: totalUsers - usersWithCompanies,
    recentUsers,
  };
};

// TODO: Add service function for handling CV upload (separate endpoint likely needed)
