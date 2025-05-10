import { z } from 'zod';

export const createEducationCertificateSchema = z.object({
  body: z.object({
    degree: z.string().min(1, 'Degree is required'),
    university: z.string().min(1, 'University/Institution is required'),
    certificateName: z.string().optional().nullable(),
    startDate: z.coerce.date({ message: 'Invalid start date' }), // Coerce string/number to Date
    endDate: z.coerce
      .date({ message: 'Invalid end date' })
      .optional()
      .nullable(), // Nullable if ongoing
  }),
});

export const updateEducationCertificateSchema = z.object({
  params: z.object({
    certificateId: z.string().cuid('Invalid certificate ID'),
  }),
  body: z.object({
    degree: z.string().min(1, 'Degree is required').optional(),
    university: z
      .string()
      .min(1, 'University/Institution is required')
      .optional(),
    certificateName: z.string().optional().nullable(),
    startDate: z.coerce.date({ message: 'Invalid start date' }).optional(),
    endDate: z.coerce
      .date({ message: 'Invalid end date' })
      .optional()
      .nullable(),
  }),
});

export const getOrDeleteEducationCertificateSchema = z.object({
  params: z.object({
    certificateId: z.string().cuid('Invalid certificate ID'),
  }),
});
