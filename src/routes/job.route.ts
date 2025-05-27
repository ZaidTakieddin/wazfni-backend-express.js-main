import express from 'express';
import auth from '../middlewares/auth';
import authorize from '../middlewares/authorize'; // Import authorize middleware
import validate from '../middlewares/validate';
import * as jobValidation from '../validations/job.validation';
import * as jobController from '../controllers/job.controller';

const router = express.Router();

router.get('/', auth, jobController.getJobs);

// Routes for companies managing their jobs
router
  .route('/company')
  // User must be authenticated AND associated with a company to post jobs
  .post(
    auth,
    authorize([], true), // No specific role, but require company=true
    validate(jobValidation.createJobSchema),
    jobController.createJobPost,
  )
  // User must be authenticated AND associated with a company to get their jobs
  .get(auth, authorize([], true), jobController.getMyCompanyJobs);

// Route for getting archived jobs
router.get(
  '/company/archived',
  auth,
  authorize([], true),
  jobController.getMyCompanyArchivedJobs,
);

// Define specific routes like /search BEFORE parameterized routes like /:jobId
router.get('/search', jobController.searchJobs);

// Routes for specific jobs
router
  .route('/:jobId')
  // Get a single job (public? or require auth?)
  // Let's make it public for now, add auth/authorize if needed
  .get(auth, jobController.getJobPost)
  // User must be authenticated AND associated with a company to update their job
  .patch(
    auth,
    authorize([], true),
    validate(jobValidation.updateJobSchema),
    jobController.updateJobPost,
  )
  // User must be authenticated AND associated with a company to delete their job
  .delete(auth, authorize([], true), jobController.deleteJobPost);

// Routes for archiving specific jobs
router.patch(
  '/:jobId/archive',
  auth,
  authorize([], true),
  jobController.archiveJobPost,
);

router.patch(
  '/:jobId/unarchive',
  auth,
  authorize([], true),
  jobController.unarchiveJobPost,
);

export default router;
