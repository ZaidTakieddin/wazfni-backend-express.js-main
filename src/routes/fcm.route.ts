import { Router } from 'express';
import { FCMController } from '../controllers/fcm.controller';
import authenticateToken from '../middlewares/auth';

const router = Router();

// All FCM routes require authentication
router.use(authenticateToken);

// Register push token (Expo)
router.post('/register', FCMController.registerToken);

// Remove push token (Expo)
router.post('/remove', FCMController.removeToken);

// Test push notification (development only)
router.post('/test', FCMController.testNotification);

export default router;
