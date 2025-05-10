import express from 'express';
import auth from '../middlewares/auth';
import validate from '../middlewares/validate';
// Import specific schemas
import {
  createWorkExperienceSchema,
  updateWorkExperienceSchema,
  getOrDeleteWorkExperienceSchema,
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
    workExperienceController.getMyWorkExperiences,
  );

router
  .route('/:experienceId')
  .get(
    auth,
    validate(getOrDeleteWorkExperienceSchema),
    workExperienceController.getWorkExperience,
  )
  .patch(
    auth,
    validate(updateWorkExperienceSchema),
    workExperienceController.updateWorkExperience,
  )
  .delete(
    auth,
    validate(getOrDeleteWorkExperienceSchema),
    workExperienceController.deleteWorkExperience,
  );

export default router;
