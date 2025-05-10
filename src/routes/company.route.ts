import express from 'express';
import auth from '../middlewares/auth';
import validate from '../middlewares/validate';
import {
  createCompanySchema,
  updateCompanySchema,
} from '../validations/company.validation';
import * as companyController from '../controllers/company.controller';
import { uploadLogo } from '../middlewares/upload';

const router = express.Router();

// Define routes for the logged-in user's company
router
  .route('/') // Base path for the user's company relative to where this router is mounted
  .post(
    auth,
    uploadLogo,
    validate(createCompanySchema),
    companyController.createMyCompany,
  )
  .get(auth, companyController.getMyCompany)
  .patch(
    auth,
    uploadLogo,
    validate(updateCompanySchema),
    companyController.updateMyCompany,
  );

// Note: We don't have a specific DELETE for the user's company here.
// Deleting the user cascades to delete the company due to schema onDelete: Cascade.
// If you need to decouple company deletion, adjust the schema and add a DELETE endpoint.

export default router;
