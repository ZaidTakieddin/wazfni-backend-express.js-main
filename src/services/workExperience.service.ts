import { Prisma, WorkExperience } from '@prisma/client';
import httpStatus from 'http-status';
import prisma from '../config/prisma';
import ApiError from '../utils/ApiError';

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
 * Get all work experiences for a user profile.
 * @param userProfileId
 * @returns
 */
export const getWorkExperiencesByProfileId = async (
  userProfileId: string,
): Promise<WorkExperience[]> => {
  return prisma.workExperience.findMany({
    where: { userProfileId },
    orderBy: { startDate: 'desc' }, // Example ordering
  });
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
