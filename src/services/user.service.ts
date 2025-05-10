import { Prisma, User, UserProfile } from '@prisma/client';
import httpStatus from 'http-status';
import prisma from '../config/prisma';
import { getRelativePath } from '../middlewares/upload'; // Import helper
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
  // Ensure the profile exists, or create it before updating
  // This uses upsert for atomicity: find or create, then update.
  // const profile = await getUserProfile(userId);

  const { birthDate, ...restOfBody } = updateBody;

  // Get relative paths if provided
  const relativeCvPath = filePaths.cv
    ? getRelativePath(filePaths.cv)
    : undefined;
  const relativeAvatarPath = filePaths.avatar
    ? getRelativePath(filePaths.avatar)
    : undefined;

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

// TODO: Add service function for handling CV upload (separate endpoint likely needed)
