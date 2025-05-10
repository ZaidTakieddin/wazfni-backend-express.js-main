import { z } from 'zod';

export const createApplicationSchema = z.object({
  params: z.object({
    jobId: z.string().cuid('Invalid Job ID'),
  }),
  body: z.object({
    // Expect an array of strings for answers
    answers: z
      .array(z.string().min(1, 'Answer cannot be empty'))
      .min(1, 'At least one answer is required'), // Basic check, controller will verify count
  }),
  // Note: CV upload is handled by multer, not validated here in Zod body
});

export const getApplicationsSchema = z.object({
  params: z.object({
    jobId: z.string().cuid('Invalid Job ID'),
  }),
});

export const getApplicationSchema = z.object({
  params: z.object({
    applicationId: z.string().cuid('Invalid Application ID'),
  }),
});

export const getMyApplicationsSchema = z.object({
  params: z.object({
    applicationId: z.string().cuid('Invalid Application ID'),
  }),
});
