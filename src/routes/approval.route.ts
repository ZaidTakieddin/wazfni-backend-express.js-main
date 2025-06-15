import express from 'express';
import auth from '../middlewares/auth';
import authorize from '../middlewares/authorize';
import validate from '../middlewares/validate';
import * as approvalValidation from '../validations/approval.validation';
import * as approvalController from '../controllers/approval.controller';
import { Role } from '@prisma/client';

const router = express.Router();

// All approval routes require admin authentication
router.use(auth);
router.use(authorize([Role.ADMIN]));

// Company approval routes
router.get('/companies/pending', approvalController.getPendingCompanies);
router.get('/companies/all', approvalController.getAllCompaniesForAdmin);

router
  .route('/companies/:companyId')
  .get(
    validate(approvalValidation.getCompanyForReviewSchema),
    approvalController.getCompanyForReview,
  );

router.patch(
  '/companies/:companyId/approve',
  validate(approvalValidation.approveCompanySchema),
  approvalController.approveCompany,
);

router.patch(
  '/companies/:companyId/reject',
  validate(approvalValidation.rejectCompanySchema),
  approvalController.rejectCompany,
);

// Job approval routes
router.get('/jobs/pending', approvalController.getPendingJobs);
router.get('/jobs/all', approvalController.getAllJobsForAdmin);

router
  .route('/jobs/:jobId')
  .get(
    validate(approvalValidation.getJobForReviewSchema),
    approvalController.getJobForReview,
  );

router.patch(
  '/jobs/:jobId/approve',
  validate(approvalValidation.approveJobSchema),
  approvalController.approveJob,
);

router.patch(
  '/jobs/:jobId/reject',
  validate(approvalValidation.rejectJobSchema),
  approvalController.rejectJob,
);

export default router;
