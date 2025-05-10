import express from 'express';
import auth from '../middlewares/auth';
import validate from '../middlewares/validate';
import {
  bookmarkJobSchema,
  unbookmarkJobSchema,
  isJobBookmarkedSchema,
} from '../validations/bookmark.validation';
import * as bookmarkController from '../controllers/bookmark.controller';

const router = express.Router();

// Bookmark a job
router.post(
  '/jobs/:jobId',
  auth,
  validate(bookmarkJobSchema),
  bookmarkController.bookmarkJob,
);

// Unbookmark a job
router.delete(
  '/jobs/:jobId',
  auth,
  validate(unbookmarkJobSchema),
  bookmarkController.unbookmarkJob,
);

// Get all bookmarked jobs for the current user
router.get('/jobs', auth, bookmarkController.getBookmarkedJobs);

// Check if a job is bookmarked
router.get(
  '/jobs/:jobId/status',
  auth,
  validate(isJobBookmarkedSchema),
  bookmarkController.isJobBookmarked,
);

export default router;
