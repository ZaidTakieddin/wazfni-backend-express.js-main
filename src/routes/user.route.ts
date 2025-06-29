import express from 'express';
import auth from '../middlewares/auth';
import validate from '../middlewares/validate';
import {
  updateUserProfileSchema,
  getUserSchema,
  getAllUsersSchema,
  createUserSchema,
  updateUserSchema,
  deleteUserSchema,
  getUserDetailSchema,
} from '../validations/user.validation';
import * as userController from '../controllers/user.controller';
import { uploadProfileFiles } from '../middlewares/upload';
import authorize from '../middlewares/authorize';
import { Role } from '@prisma/client';

const router = express.Router();

// ===== PUBLIC USER ROUTES =====

// Routes for the currently authenticated user's profile
router
  .route('/profile/me')
  .get(auth, userController.getMyProfile) // Get my profile
  .patch(
    auth,
    uploadProfileFiles,
    validate(updateUserProfileSchema),
    userController.updateMyProfile,
  ); // Update my profile

// Route for getting a specific user's profile by userId
router.route('/:userId/profile').get(
  auth, // Require authentication
  // authorize(['ADMIN']), // TODO: Consider adding admin authorization
  validate(getUserSchema), // Validate the userId param
  userController.getUserProfileById, // Use the new controller
);

// Routes for specific user (typically admin actions)
router
  .route('/:userId')
  .get(auth, validate(getUserSchema), userController.getUser); // Get user by ID
// .patch(...) // Future implementation for admin updating user
// .delete(...) // Future implementation for admin deleting user

// ===== ADMIN USER MANAGEMENT ROUTES =====

// Admin statistics endpoint
router.get(
  '/admin/statistics',
  auth,
  authorize([Role.ADMIN]),
  userController.getUserStatistics,
);

// Admin routes for managing all users
router
  .route('/admin/users')
  .get(
    auth,
    authorize([Role.ADMIN]),
    validate(getAllUsersSchema),
    userController.getAllUsers,
  )
  .post(
    auth,
    authorize([Role.ADMIN]),
    validate(createUserSchema),
    userController.createUser,
  );

// Admin routes for managing specific users
router
  .route('/admin/users/:userId')
  .get(
    auth,
    authorize([Role.ADMIN]),
    validate(getUserDetailSchema),
    userController.getUserDetail,
  )
  .patch(
    auth,
    authorize([Role.ADMIN]),
    validate(updateUserSchema),
    userController.updateUser,
  )
  .delete(
    auth,
    authorize([Role.ADMIN]),
    validate(deleteUserSchema),
    userController.deleteUser,
  );

export default router;
