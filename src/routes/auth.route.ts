import express from 'express';
import * as authController from '../controllers/auth.controller';
import auth from '../middlewares/auth';
import validate from '../middlewares/validate';
import {
  loginSchema,
  registerSchema,
  changePasswordSchema,
  googleAuthSchema,
} from '../validations/auth.validation';

const router = express.Router();

// === Standard Auth ===
router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);

// === Google OAuth ===
router.post('/google', validate(googleAuthSchema), authController.googleAuth);

// === Password Management ===
// Requires user to be authenticated to change password
router.patch(
  '/change-password',
  auth,
  validate(changePasswordSchema),
  authController.changePassword,
);

// === Logout ===
// Requires user to be authenticated to logout
router.post('/logout', auth, authController.logout);

// TODO: Add routes for refresh-tokens, forgot-password, reset-password

export default router;
