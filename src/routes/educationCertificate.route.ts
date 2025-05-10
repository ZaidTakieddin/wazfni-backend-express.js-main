import express from 'express';
import auth from '../middlewares/auth';
import validate from '../middlewares/validate';
// Import specific schemas
import {
  createEducationCertificateSchema,
  updateEducationCertificateSchema,
  getOrDeleteEducationCertificateSchema,
} from '../validations/educationCertificate.validation';
import * as educationCertificateController from '../controllers/educationCertificate.controller';

const router = express.Router();

router
  .route('/')
  .post(
    auth, // Require authentication
    validate(createEducationCertificateSchema),
    educationCertificateController.createEducationCertificate,
  )
  .get(
    auth, // Require authentication
    educationCertificateController.getMyEducationCertificates,
  );

router
  .route('/:certificateId')
  .get(
    auth,
    validate(getOrDeleteEducationCertificateSchema),
    educationCertificateController.getEducationCertificate,
  )
  .patch(
    auth,
    validate(updateEducationCertificateSchema),
    educationCertificateController.updateEducationCertificate,
  )
  .delete(
    auth,
    validate(getOrDeleteEducationCertificateSchema),
    educationCertificateController.deleteEducationCertificate,
  );

export default router;
