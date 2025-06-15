import { z } from 'zod';
import {
  WorkType,
  ExperienceLevel,
  Currency,
  ContractType,
  SalaryType,
} from '@prisma/client'; // Import generated enums

export const createJobSchema = z.object({
  body: z
    .object({
      jobTitle: z.string().min(1, 'Job title is required'),
      subCategoryIds: z
        .array(z.string().cuid('Each subcategory ID must be a valid CUID'))
        .min(1, 'At least one subcategory ID is required'),
      workType: z.nativeEnum(WorkType, { message: 'Invalid work type' }),
      contractType: z.nativeEnum(ContractType, {
        message: 'Invalid contract type',
      }),
      experienceLevel: z.nativeEnum(ExperienceLevel, {
        message: 'Invalid experience level',
      }),
      experienceYears: z.number().int().min(0).optional(),
      salaryType: z
        .nativeEnum(SalaryType, { message: 'Invalid salary type' })
        .default('NONE'),
      minSalary: z.number().int().min(0).optional(),
      maxSalary: z.number().int().min(0).optional(),
      currency: z
        .nativeEnum(Currency, { message: 'Invalid currency' })
        .optional(),
      jobFeatures: z.array(z.string().min(1)).optional().default([]),
      description: z.string().min(1, 'Description is required'),
      requirements: z.string().min(1, 'Requirements are required'),
      questions: z.array(z.string().min(1)).optional().default([]),
    })
    .refine(
      (data) => {
        // Validate salary logic based on salaryType
        if (data.salaryType === 'FIXED') {
          return (
            data.minSalary !== undefined &&
            data.minSalary !== null &&
            data.minSalary > 0
          );
        }
        if (data.salaryType === 'RANGE') {
          return (
            data.minSalary !== undefined &&
            data.minSalary !== null &&
            data.maxSalary !== undefined &&
            data.maxSalary !== null &&
            data.minSalary > 0 &&
            data.maxSalary > 0 &&
            data.maxSalary > data.minSalary
          );
        }
        if (data.salaryType === 'NONE') {
          return true; // No salary validation needed
        }
        return false;
      },
      {
        message:
          'Invalid salary configuration: FIXED requires minSalary, RANGE requires both minSalary and maxSalary with maxSalary > minSalary',
        path: ['salaryType'],
      },
    ),
});

export const updateJobSchema = z.object({
  body: z
    .object({
      jobTitle: z.string().min(1, 'Job title is required').optional(),
      subCategoryIds: z
        .array(z.string().cuid('Each subcategory ID must be a valid CUID'))
        .min(1, 'At least one subcategory ID is required')
        .optional(),
      workType: z
        .nativeEnum(WorkType, { message: 'Invalid work type' })
        .optional(),
      contractType: z
        .nativeEnum(ContractType, {
          message: 'Invalid contract type',
        })
        .optional(),
      experienceLevel: z
        .nativeEnum(ExperienceLevel, {
          message: 'Invalid experience level',
        })
        .optional(),
      experienceYears: z.number().int().min(0).optional(),
      salaryType: z
        .nativeEnum(SalaryType, { message: 'Invalid salary type' })
        .optional(),
      minSalary: z.number().int().min(0).optional(),
      maxSalary: z.number().int().min(0).optional(),
      currency: z
        .nativeEnum(Currency, { message: 'Invalid currency' })
        .optional(),
      jobFeatures: z.array(z.string().min(1)).optional(),
      description: z.string().min(1, 'Description is required').optional(),
      requirements: z.string().min(1, 'Requirements are required').optional(),
      questions: z.array(z.string().min(1)).optional(),
    })
    .partial()
    .refine(
      (data) => {
        // Validate salary logic based on salaryType if provided
        if (data.salaryType === 'FIXED' && data.salaryType !== undefined) {
          return (
            data.minSalary !== undefined &&
            data.minSalary !== null &&
            data.minSalary > 0
          );
        }
        if (data.salaryType === 'RANGE' && data.salaryType !== undefined) {
          return (
            data.minSalary !== undefined &&
            data.minSalary !== null &&
            data.maxSalary !== undefined &&
            data.maxSalary !== null &&
            data.minSalary > 0 &&
            data.maxSalary > 0 &&
            data.maxSalary > data.minSalary
          );
        }
        return true; // No validation needed for NONE or when salaryType is not provided
      },
      {
        message:
          'Invalid salary configuration: FIXED requires minSalary, RANGE requires both minSalary and maxSalary with maxSalary > minSalary',
        path: ['salaryType'],
      },
    ),
  params: z.object({
    jobId: z.string().cuid('Invalid Job ID'),
  }),
});

export const getJobSchema = z.object({
  params: z.object({
    jobId: z.string().cuid('Invalid Job ID'),
  }),
});

export const archiveJobSchema = z.object({
  params: z.object({
    jobId: z.string().cuid('Invalid Job ID'),
  }),
  body: z.object({
    archive: z.boolean().default(true),
  }),
});

export const searchJobsSchema = z.object({
  query: z.object({
    searchTerm: z.string().optional(),
    title: z.string().optional(),
    city: z.string().optional(),
    subCategory: z.string().optional(),
    companyName: z.string().optional(),
    workType: z.string().optional(),
  }),
});
