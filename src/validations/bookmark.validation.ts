import { z } from 'zod';
import { jobPaginationSchema } from './common.validation';

export const bookmarkJobSchema = z.object({
  body: z.object({
    jobId: z.string(),
  }),
});

export const unbookmarkJobSchema = z.object({
  body: z.object({
    jobId: z.string(),
  }),
});

export const isJobBookmarkedSchema = z.object({
  query: z.object({
    jobId: z.string(),
  }),
});

export const getBookmarkedJobsSchema = z.object({
  query: jobPaginationSchema,
});
