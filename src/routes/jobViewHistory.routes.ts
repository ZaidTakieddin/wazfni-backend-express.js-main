import { Router } from 'express';
import {
  recordJobView,
  getUserJobViews,
  getRecommendedJobs,
} from '../controllers/jobViewHistory.controller';
import auth from '@/middlewares/auth';

const router = Router();

// Record a job view
router.post('/:jobId', auth, recordJobView);

// Get user's job views
router.get('/my-views', auth, getUserJobViews);

// Get recommended jobs based on category clicks
router.get('/recommended', auth, getRecommendedJobs);

export default router;
