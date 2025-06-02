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
      categoryIds: z
        .array(z.string().cuid('Each category ID must be a valid CUID'))
        .min(1, 'At least one category ID is required'),
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

// Optional: Add an update schema if needed, likely making all fields optional
export const updateJobSchema = createJobSchema.deepPartial(); // Makes all nested fields optional
