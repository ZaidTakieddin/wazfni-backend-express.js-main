import { Prisma, EducationCertificate } from '@prisma/client';
import httpStatus from 'http-status';
import prisma from '../config/prisma';
import ApiError from '../utils/ApiError';

// Type for the input data from validation
type EducationCertificateInput = Omit<
  EducationCertificate,
  'id' | 'userProfileId' | 'createdAt' | 'updatedAt'
>;

/**
 * Create education certificate for a user profile.
 * @param userProfileId
 * @param data
 * @returns
 */
export const createEducationCertificate = async (
  userProfileId: string,
  data: EducationCertificateInput,
): Promise<EducationCertificate> => {
  return prisma.educationCertificate.create({
    data: {
      ...data,
      userProfile: {
        connect: { id: userProfileId },
      },
    },
  });
};

/**
 * Get all education certificates for a user profile.
 * @param userProfileId
 * @returns
 */
export const getEducationCertificatesByProfileId = async (
  userProfileId: string,
): Promise<EducationCertificate[]> => {
  return prisma.educationCertificate.findMany({
    where: { userProfileId },
    orderBy: { startDate: 'desc' }, // Example ordering
  });
};

/**
 * Get a single education certificate by ID, ensuring it belongs to the profile.
 * @param userProfileId
 * @param certificateId
 * @returns
 * @throws {ApiError} If not found or doesn't belong to the user.
 */
export const getEducationCertificateById = async (
  userProfileId: string,
  certificateId: string,
): Promise<EducationCertificate> => {
  const certificate = await prisma.educationCertificate.findUnique({
    where: { id: certificateId },
  });

  if (!certificate || certificate.userProfileId !== userProfileId) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Education certificate not found');
  }
  return certificate;
};

/**
 * Update an education certificate by ID, ensuring it belongs to the profile.
 * @param userProfileId
 * @param certificateId
 * @param updateData
 * @returns
 * @throws {ApiError} If not found or doesn't belong to the user.
 */
export const updateEducationCertificateById = async (
  userProfileId: string,
  certificateId: string,
  updateData: Partial<EducationCertificateInput>,
): Promise<EducationCertificate> => {
  // First verify ownership
  await getEducationCertificateById(userProfileId, certificateId);

  return prisma.educationCertificate.update({
    where: { id: certificateId },
    data: updateData,
  });
};

/**
 * Delete an education certificate by ID, ensuring it belongs to the profile.
 * @param userProfileId
 * @param certificateId
 * @throws {ApiError} If not found or doesn't belong to the user.
 */
export const deleteEducationCertificateById = async (
  userProfileId: string,
  certificateId: string,
): Promise<void> => {
  // First verify ownership
  await getEducationCertificateById(userProfileId, certificateId);

  await prisma.educationCertificate.delete({
    where: { id: certificateId },
  });
};
