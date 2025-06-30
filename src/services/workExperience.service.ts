import { Prisma, WorkExperience } from '@prisma/client';
import httpStatus from 'http-status';
import prisma from '../config/prisma';
import ApiError from '../utils/ApiError';
import {
  PaginationOptions,
  PaginatedResponse,
  parsePaginationOptionsLegacy,
  calculateSkip,
  createPaginatedResponse,
} from '../utils/pagination';

// Type for the input data from validation
type WorkExperienceInput = Omit<
  WorkExperience,
  'id' | 'userProfileId' | 'createdAt' | 'updatedAt'
>;

/**
 * Create work experience for a user profile.
 * @param userProfileId
 * @param data
 * @returns
 */
export const createWorkExperience = async (
  userProfileId: string,
  data: WorkExperienceInput,
): Promise<WorkExperience> => {
  return prisma.workExperience.create({
    data: {
      ...data,
      userProfile: {
        connect: { id: userProfileId },
      },
    },
  });
};

/**
 * Get all work experiences for a user profile with pagination.
 * @param userProfileId - User Profile ID
 * @param paginationOptions - Pagination options
 * @returns Promise with paginated work experiences
 */
export const getWorkExperiencesByProfileId = async (
  userProfileId: string,
  paginationOptions: PaginationOptions = {},
): Promise<PaginatedResponse<WorkExperience>> => {
  const { page, limit, sortBy, sortOrder } = parsePaginationOptionsLegacy(
    paginationOptions,
    'startDate',
  );

  const where = { userProfileId };

  // Get total count
  const total = await prisma.workExperience.count({ where });

  // Get work experiences with pagination
  const workExperiences = await prisma.workExperience.findMany({
    where,
    skip: calculateSkip(page, limit),
    take: limit,
    orderBy: { [sortBy]: sortOrder },
  });

  return createPaginatedResponse(workExperiences, page, limit, total);
};

/**
 * Get a single work experience by ID, ensuring it belongs to the profile.
 * @param userProfileId
 * @param experienceId
 * @returns
 * @throws {ApiError} If not found or doesn't belong to the user.
 */
export const getWorkExperienceById = async (
  userProfileId: string,
  experienceId: string,
): Promise<WorkExperience> => {
  const experience = await prisma.workExperience.findUnique({
    where: { id: experienceId },
  });

  if (!experience || experience.userProfileId !== userProfileId) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Work experience not found');
  }
  return experience;
};

/**
 * Update a work experience by ID, ensuring it belongs to the profile.
 * @param userProfileId
 * @param experienceId
 * @param updateData
 * @returns
 * @throws {ApiError} If not found or doesn't belong to the user.
 */
export const updateWorkExperienceById = async (
  userProfileId: string,
  experienceId: string,
  updateData: Partial<WorkExperienceInput>,
): Promise<WorkExperience> => {
  // First verify ownership
  await getWorkExperienceById(userProfileId, experienceId);

  return prisma.workExperience.update({
    where: { id: experienceId }, // No need to check userProfileId here again due to the check above
    data: updateData,
  });
};

/**
 * Delete a work experience by ID, ensuring it belongs to the profile.
 * @param userProfileId
 * @param experienceId
 * @throws {ApiError} If not found or doesn't belong to the user.
 */
export const deleteWorkExperienceById = async (
  userProfileId: string,
  experienceId: string,
): Promise<void> => {
  // First verify ownership
  await getWorkExperienceById(userProfileId, experienceId);

  await prisma.workExperience.delete({
    where: { id: experienceId },
  });
};
