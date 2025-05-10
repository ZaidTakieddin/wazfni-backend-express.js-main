import { z } from 'zod';
import {
  WorkType,
  ExperienceLevel,
  Currency,
  ContractType,
} from '@prisma/client'; // Import generated enums

export const createJobSchema = z.object({
  body: z.object({
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
    minSalary: z.number().int().min(0).optional(),
    maxSalary: z.number().int().min(0).optional(),
    currency: z
      .nativeEnum(Currency, { message: 'Invalid currency' })
      .optional(),
    jobFeatures: z.array(z.string().min(1)).optional().default([]),
    description: z.string().min(1, 'Description is required'),
    requirements: z.string().min(1, 'Requirements are required'),
    questions: z.array(z.string().min(1)).optional().default([]),
  }),
});

// Optional: Add an update schema if needed, likely making all fields optional
export const updateJobSchema = createJobSchema.deepPartial(); // Makes all nested fields optional
