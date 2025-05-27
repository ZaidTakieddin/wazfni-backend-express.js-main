// src/routes/application.route.ts
import express from 'express';
import auth from '../middlewares/auth';
// import authorize from '../middlewares/authorize'; // No longer needed here
import validate from '../middlewares/validate';
import {
  createApplicationSchema,
  getApplicationsSchema,
  getApplicationSchema,
  getMyApplicationsSchema,
  updateApplicationStatusSchema,
} from '../validations/application.validation'; // Specific import
import * as applicationController from '../controllers/application.controller'; // Index export
import { uploadCv } from '../middlewares/upload'; // Middleware for CV upload on apply
import { verifyJobOwnership } from '../middlewares/verifyJobOwnership'; // Import new middleware

const router = express.Router();

// --- Applicant Routes ---

// Apply for a specific job (POST /api/v1/applications/job/:jobId)
router.route('/job/:jobId').post(
  auth, // User must be logged in
  uploadCv, // Handle optional CV upload (field name 'cv')
  validate(createApplicationSchema),
  applicationController.applyForJob,
);

// --- Company Routes ---

// Get applications for a specific job posted by the logged-in user's company
// (GET /api/v1/applications/company/job/:jobId)
// NOTE: This assumes the main router mounts this under '/applications'
// We need to ensure only the company that posted the job can access this.
// The 'authorize' middleware might need adjustment, or use the service layer check.
router.route('/company/job/:jobId').get(
  auth, // 1. Check authentication
  validate(getApplicationsSchema), // 2. Validate jobId format
  verifyJobOwnership, // 3. Verify user's company owns this job
  applicationController.getJobApplications, // 4. Proceed to controller
);

// Get a specific application by its ID (ensuring company ownership via service layer)
router.route('/:applicationId').get(
  auth, // 1. Check authentication
  validate(getApplicationSchema), // 2. Validate applicationId format
  applicationController.getApplication, // 3. Controller calls service (which checks ownership)
);

// Get all applications for the logged-in applicant
router.route('/user/applications').get(
  auth, // 1. Check authentication
  validate(getMyApplicationsSchema), // 2. Validate applicationId format
  applicationController.getMyApplications, // 2. Controller calls service
);

// Update application status (company evaluates application)
router.route('/:applicationId/status').patch(
  auth, // 1. Check authentication
  validate(updateApplicationStatusSchema), // 2. Validate applicationId format and status
  applicationController.updateApplicationStatus, // 3. Controller calls service
);

export default router;
