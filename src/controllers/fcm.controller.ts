import { Request, Response } from 'express';
import { NotificationService } from '../services/notification.service';

export class FCMController {
  /**
   * Register FCM token for authenticated user
   */
  static async registerToken(req: Request, res: Response): Promise<void> {
    try {
      const { token } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: 'المستخدم غير مصرح له' });
        return;
      }

      if (!token) {
        res.status(400).json({ error: 'رمز FCM مطلوب' });
        return;
      }

      await NotificationService.addTokenForUser(userId, token);

      res.status(200).json({
        message: 'تم تسجيل رمز الإشعارات بنجاح',
        success: true,
      });
    } catch (error) {
      console.error('Error registering FCM token:', error);
      res.status(500).json({ error: 'خطأ في تسجيل رمز الإشعارات' });
    }
  }

  /**
   * Remove FCM token for authenticated user
   */
  static async removeToken(req: Request, res: Response): Promise<void> {
    try {
      const { token } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: 'المستخدم غير مصرح له' });
        return;
      }

      if (!token) {
        res.status(400).json({ error: 'رمز FCM مطلوب' });
        return;
      }

      await NotificationService.removeTokenForUser(userId, token);

      res.status(200).json({
        message: 'تم حذف رمز الإشعارات بنجاح',
        success: true,
      });
    } catch (error) {
      console.error('Error removing FCM token:', error);
      res.status(500).json({ error: 'خطأ في حذف رمز الإشعارات' });
    }
  }
}
