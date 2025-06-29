import express from 'express';
import auth from '../middlewares/auth';
import validate from '../middlewares/validate';
// Import specific schemas
import {
  createWorkExperienceSchema,
  updateWorkExperienceSchema,
  getWorkExperienceSchema,
  deleteWorkExperienceSchema,
  getWorkExperiencesSchema,
} from '../validations/workExperience.validation';
import * as workExperienceController from '../controllers/workExperience.controller';

const router = express.Router();

router
  .route('/')
  .post(
    auth, // Require authentication
    validate(createWorkExperienceSchema),
    workExperienceController.createWorkExperience,
  )
  .get(
    auth, // Require authentication
    validate(getWorkExperiencesSchema),
    workExperienceController.getMyWorkExperiences,
  );

router
  .route('/:workExperienceId')
  .get(
    auth,
    validate(getWorkExperienceSchema),
    workExperienceController.getWorkExperience,
  )
  .patch(
    auth,
    validate(updateWorkExperienceSchema),
    workExperienceController.updateWorkExperience,
  )
  .delete(
    auth,
    validate(deleteWorkExperienceSchema),
    workExperienceController.deleteWorkExperience,
  );

export default router;
