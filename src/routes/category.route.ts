import express from 'express';
import auth from '../middlewares/auth';
import authorize from '../middlewares/authorize';
import validate from '../middlewares/validate';
import * as categoryValidation from '../validations/category.validation';
import * as categoryController from '../controllers/category.controller';
import { Role } from '@prisma/client';

const router = express.Router();

// Public route to get all categories
router.get(
  '/',
  validate(categoryValidation.getCategoriesSchema),
  categoryController.getCategories,
);

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
  // Public route to get a single category
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

// SubCategory Routes

// Get all subcategories for a specific category (public)
router.get(
  '/:categoryId/subcategories',
  validate(categoryValidation.getSubCategoriesSchema),
  categoryController.getSubCategoriesByCategory,
);

// Create a subcategory under a specific category (admin only)
router.post(
  '/:categoryId/subcategories',
  auth,
  authorize([Role.ADMIN]),
  validate(categoryValidation.createSubCategorySchema),
  categoryController.createSubCategory,
);

// SubCategory operations by ID
router
  .route('/subcategories/:subCategoryId')
  // Public route to get a single subcategory
  .get(
    validate(categoryValidation.getSubCategorySchema),
    categoryController.getSubCategory,
  )
  .patch(
    auth,
    authorize([Role.ADMIN]), // Only ADMIN can update
    validate(categoryValidation.updateSubCategorySchema),
    categoryController.updateSubCategory,
  )
  .delete(
    auth,
    authorize([Role.ADMIN]), // Only ADMIN can delete
    validate(categoryValidation.deleteSubCategorySchema),
    categoryController.deleteSubCategory,
  );

export default router;
