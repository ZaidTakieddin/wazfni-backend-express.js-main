import express from 'express';
import auth from '../middlewares/auth';
import authorize from '../middlewares/authorize';
import validate from '../middlewares/validate';
import * as categoryValidation from '../validations/category.validation';
import * as categoryController from '../controllers/category.controller';
import { Role } from '@prisma/client';

const router = express.Router();

// Public route to get all categories
router.get('/', categoryController.getCategories);

// Admin routes for managing categories
router.post(
  '/',
  auth,
  authorize([Role.ADMIN]), // Only ADMIN can create
  validate(categoryValidation.createCategorySchema),
  categoryController.createCategory,
);

router
  .route('/:categoryId')
  // Public route to get a single category?
  .get(categoryController.getCategory)
  .patch(
    auth,
    authorize([Role.ADMIN]), // Only ADMIN can update
    validate(categoryValidation.updateCategorySchema),
    categoryController.updateCategory,
  )
  .delete(
    auth,
    authorize([Role.ADMIN]), // Only ADMIN can delete
    categoryController.deleteCategory,
  );

export default router;
