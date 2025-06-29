import { z } from 'zod';
import { listPaginationSchema } from './common.validation';

export const createWorkExperienceSchema = z.object({
  body: z.object({
    jobTitle: z.string().min(1, 'Job title is required'),
    companyName: z.string().min(1, 'Company name is required'),
    startDate: z.string().datetime('Invalid start date'),
    endDate: z.string().datetime('Invalid end date').optional(),
    description: z.string().optional(),
    current: z.boolean().optional(),
  }),
});

export const updateWorkExperienceSchema = z.object({
  params: z.object({
    workExperienceId: z.string(),
  }),
  body: z.object({
    jobTitle: z.string().min(1).optional(),
    companyName: z.string().min(1).optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    description: z.string().optional(),
    current: z.boolean().optional(),
  }),
});

export const deleteWorkExperienceSchema = z.object({
  params: z.object({
    workExperienceId: z.string(),
  }),
});

export const getWorkExperienceSchema = z.object({
  params: z.object({
    workExperienceId: z.string(),
  }),
});

export const getWorkExperiencesSchema = z.object({
  query: listPaginationSchema,
});
