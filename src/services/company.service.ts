import { Company, Prisma } from '@prisma/client';
import httpStatus from 'http-status';
import prisma from '../config/prisma';
import ApiError from '../utils/ApiError';
import {
  getRelativePath,
  deleteFileByRelativePath,
} from '../middlewares/upload';
import { PushNotificationService } from './pushNotification.service';

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

  // Send notification to admins about new company for review
  try {
    await PushNotificationService.sendToAdmins({
      title: 'شركة جديدة للمراجعة',
      body: `شركة ${company.name || 'غير محددة'} تحتاج للموافقة`,
      data: {
        type: 'admin_review',
        companyId: company.id,
      },
      channelId: 'admin_notifications',
    });
  } catch (error) {
    console.error('Failed to send admin notification for new company:', error);
    // Don't throw error, just log it as notification failure shouldn't break company creation
  }

  return company;
};

/**
 * Get company associated with a user ID.
 * @param userId
 * @returns
 * @throws {ApiError} If no company is found for the user.
 */
export const getCompanyByUserId = async (
  userId: string,
): Promise<Company | null> => {
  const company = await prisma.company.findUnique({
    where: { userId },
  });

  if (!company) {
    return null;
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
  // Get the current company to check for existing logo
  const currentCompany = await prisma.company.findUnique({
    where: { userId },
    select: { logo: true }, // Only select the logo field for efficiency
  });

  if (!currentCompany) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      'Company not found for this user, cannot update',
    );
  }

  // Handle logo file replacement
  let shouldDeleteOldLogo = false;
  let oldLogoPath: string | null = null;

  if (logoPath && currentCompany.logo && currentCompany.logo !== logoPath) {
    // New logo is being uploaded and there's an existing logo
    shouldDeleteOldLogo = true;
    oldLogoPath = currentCompany.logo;
  }

  const relativeLogoPath = logoPath ? getRelativePath(logoPath) : logoPath; // Keep null as null

  const dataToUpdate: Prisma.CompanyUpdateInput = {
    ...updateBody,
    // Only add logo field if logoPath is provided (string or null)
    ...(logoPath !== undefined && { logo: relativeLogoPath }),
  };

  // Update the company in database
  const updatedCompany = await prisma.company.update({
    where: { userId },
    data: dataToUpdate,
  });

  // Delete old logo file after successful database update
  if (shouldDeleteOldLogo && oldLogoPath) {
    const deleted = deleteFileByRelativePath(oldLogoPath);
    if (deleted) {
      console.log(`Successfully deleted old logo: ${oldLogoPath}`);
    } else {
      console.warn(
        `Failed to delete old logo: ${oldLogoPath} (file may not exist)`,
      );
    }
  }

  return updatedCompany;
};

// TODO: Add service for logo upload
