import { z } from 'zod';

export const bookmarkJobSchema = z.object({
  params: z.object({
    jobId: z.string().cuid('Invalid Job ID'),
  }),
});

export const unbookmarkJobSchema = z.object({
  params: z.object({
    jobId: z.string().cuid('Invalid Job ID'),
  }),
});

export const isJobBookmarkedSchema = z.object({
  params: z.object({
    jobId: z.string().cuid('Invalid Job ID'),
  }),
});
