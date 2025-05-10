import { z } from 'zod';

export const createWorkExperienceSchema = z.object({
  body: z.object({
    jobTitle: z.string().min(1, 'Job title is required'),
    companyName: z.string().min(1, 'Company name is required'),
    startDate: z.coerce.date({ message: 'Invalid start date' }), // Coerce string/number to Date
    endDate: z.coerce
      .date({ message: 'Invalid end date' })
      .optional()
      .nullable(),
    description: z.string().optional().nullable(),
    current: z.boolean().optional().default(false),
  }),
});

export const updateWorkExperienceSchema = z.object({
  params: z.object({
    experienceId: z.string().cuid('Invalid experience ID'),
  }),
  body: z.object({
    jobTitle: z.string().min(1, 'Job title is required').optional(),
    companyName: z.string().min(1, 'Company name is required').optional(),
    startDate: z.coerce.date({ message: 'Invalid start date' }).optional(),
    endDate: z.coerce
      .date({ message: 'Invalid end date' })
      .optional()
      .nullable(),
    description: z.string().optional().nullable(),
    current: z.boolean().optional(),
  }),
});

export const getOrDeleteWorkExperienceSchema = z.object({
  params: z.object({
    experienceId: z.string().cuid('Invalid experience ID'),
  }),
});
