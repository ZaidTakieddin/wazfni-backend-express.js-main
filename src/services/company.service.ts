import { Company, Prisma } from '@prisma/client';
import httpStatus from 'http-status';
import prisma from '../config/prisma';
import ApiError from '../utils/ApiError';
import { getRelativePath } from '../middlewares/upload';

// Explicit type for creation input (optional)
export type CreateCompanyInput = Omit<
  Prisma.CompanyUncheckedCreateInput,
  'userId' | 'createdAt' | 'updatedAt' | 'id'
> & { logo?: string }; // Explicitly allow logo path

// Explicit type for update input (optional)
export type UpdateCompanyInput = Prisma.CompanyUpdateInput & {
  logo?: string | null; // Allow logo path or null to clear
};

/**
 * Create a company for a user.
 * @param userId
 * @param companyBody - Includes text fields
 * @param logoPath - Optional absolute path to uploaded logo
 * @returns
 * @throws {ApiError} If the user already has a company.
 */
export const createCompany = async (
  userId: string,
  companyBody: Omit<CreateCompanyInput, 'logo'>,
  logoPath?: string, // Separate logo path
): Promise<Company> => {
  // Check if user already has a company
  const existingCompany = await prisma.company.findUnique({
    where: { userId },
  });
  if (existingCompany) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'User already has a company associated',
    );
  }

  const relativeLogoPath = logoPath ? getRelativePath(logoPath) : undefined;

  const company = await prisma.company.create({
    data: {
      userId: userId,
      ...companyBody,
      ...(relativeLogoPath && { logo: relativeLogoPath }), // Add relative logo path if present
    },
  });
  return company;
};

/**
 * Get company associated with a user ID.
 * @param userId
 * @returns
 * @throws {ApiError} If no company is found for the user.
 */
export const getCompanyByUserId = async (userId: string): Promise<Company> => {
  const company = await prisma.company.findUnique({
    where: { userId },
  });

  if (!company) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Company not found for this user');
  }
  return company;
};

/**
 * Update company by user ID.
 * @param userId
 * @param updateBody - Includes text fields
 * @param logoPath - Optional absolute path to uploaded logo (or null/undefined to keep/remove)
 * @returns
 */
export const updateCompanyByUserId = async (
  userId: string,
  updateBody: Omit<UpdateCompanyInput, 'logo'>,
  logoPath?: string | null, // Allow string or null
): Promise<Company> => {
  // findUniqueOrThrow ensures company exists before attempting update
  await prisma.company.findUniqueOrThrow({ where: { userId } }).catch(() => {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      'Company not found for this user, cannot update',
    );
  });

  const relativeLogoPath = logoPath ? getRelativePath(logoPath) : logoPath; // Keep null as null

  const dataToUpdate: Prisma.CompanyUpdateInput = {
    ...updateBody,
    // Only add logo field if logoPath is provided (string or null)
    ...(logoPath !== undefined && { logo: relativeLogoPath }),
  };

  const updatedCompany = await prisma.company.update({
    where: { userId },
    data: dataToUpdate,
  });
  return updatedCompany;
};

// TODO: Add service for logo upload
