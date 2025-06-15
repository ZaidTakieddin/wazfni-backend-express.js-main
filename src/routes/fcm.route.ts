import { Router } from 'express';
import { FCMController } from '../controllers/fcm.controller';
import authenticateToken from '../middlewares/auth';

const router = Router();

// All FCM routes require authentication
router.use(authenticateToken);

// Register FCM token
router.post('/register', FCMController.registerToken);

// Remove FCM token
router.post('/remove', FCMController.removeToken);

export default router;
