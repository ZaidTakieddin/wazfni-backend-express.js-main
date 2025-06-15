import { z } from 'zod';

// Company approval validations
export const getCompanyForReviewSchema = z.object({
  params: z.object({
    companyId: z.string().cuid('Invalid Company ID'),
  }),
});

export const approveCompanySchema = z.object({
  params: z.object({
    companyId: z.string().cuid('Invalid Company ID'),
  }),
});

export const rejectCompanySchema = z.object({
  params: z.object({
    companyId: z.string().cuid('Invalid Company ID'),
  }),
  body: z.object({
    rejectionReason: z.string().min(1, 'Rejection reason is required'),
  }),
});

// Job approval validations
export const getJobForReviewSchema = z.object({
  params: z.object({
    jobId: z.string().cuid('Invalid Job ID'),
  }),
});

export const approveJobSchema = z.object({
  params: z.object({
    jobId: z.string().cuid('Invalid Job ID'),
  }),
});

export const rejectJobSchema = z.object({
  params: z.object({
    jobId: z.string().cuid('Invalid Job ID'),
  }),
  body: z.object({
    rejectionReason: z.string().min(1, 'Rejection reason is required'),
  }),
});
