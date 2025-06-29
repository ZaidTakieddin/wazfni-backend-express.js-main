import { z } from 'zod';
import { createPaginationSchema } from '../utils/pagination';

// Common pagination query schema
export const basePaginationSchema = z.object({
  page: z.string().transform(Number).pipe(z.number().min(1)).optional(),
  limit: z
    .string()
    .transform(Number)
    .pipe(z.number().min(1).max(100))
    .optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

// Job-specific pagination (with job-specific sort fields)
export const jobPaginationSchema = createPaginationSchema([
  'createdAt',
  'updatedAt',
  'jobTitle',
  'workType',
  'contractType',
  'experienceLevel',
  'minSalary',
  'maxSalary',
]);

// Company-specific pagination
export const companyPaginationSchema = createPaginationSchema([
  'createdAt',
  'updatedAt',
  'name',
  'workField',
  'city',
  'approvalStatus',
]);

// Application-specific pagination
export const applicationPaginationSchema = createPaginationSchema([
  'appliedAt',
  'updatedAt',
  'status',
]);

// General list pagination schema
export const listPaginationSchema = createPaginationSchema([
  'createdAt',
  'updatedAt',
  'name',
]);
