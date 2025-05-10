import express from 'express';
import auth from '../middlewares/auth';
import validate from '../middlewares/validate';
import {
  updateUserProfileSchema,
  getUserSchema,
} from '../validations/user.validation';
import * as userController from '../controllers/user.controller';
import { uploadProfileFiles } from '../middlewares/upload';
import authorize from '../middlewares/authorize';

const router = express.Router();

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

// Future routes for admin managing users could go here or in a separate admin route file
// router.route('/:userId')
//   .get(auth, /* authorize('admin'), */ userController.getUser)
//   .patch(auth, /* authorize('admin'), */ validate(...), userController.updateUser)
//   .delete(auth, /* authorize('admin'), */ userController.deleteUser);

export default router;
