import { Request, Response } from 'express';
import { PushNotificationService } from '../services/pushNotification.service';

export class FCMController {
  /**
   * Register Expo push token for authenticated user
   */
  static async registerToken(req: Request, res: Response): Promise<void> {
    try {
      const { token } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'المستخدم غير مصرح له',
        });
        return;
      }

      if (!token) {
        res.status(400).json({
          success: false,
          error: 'رمز الإشعارات مطلوب',
        });
        return;
      }

      // Validate Expo push token
      if (!PushNotificationService.isValidExpoPushToken(token)) {
        res.status(400).json({
          success: false,
          error: 'رمز الإشعارات غير صالح',
        });
        return;
      }

      await PushNotificationService.addTokenForUser(userId, token);

      res.status(200).json({
        success: true,
        message: 'تم تسجيل رمز الإشعارات بنجاح',
      });
    } catch (error) {
      console.error('Error registering push token:', error);
      res.status(500).json({
        success: false,
        error: 'خطأ في تسجيل رمز الإشعارات',
      });
    }
  }

  /**
   * Remove Expo push token for authenticated user
   */
  static async removeToken(req: Request, res: Response): Promise<void> {
    try {
      const { token } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'المستخدم غير مصرح له',
        });
        return;
      }

      if (!token) {
        res.status(400).json({
          success: false,
          error: 'رمز الإشعارات مطلوب',
        });
        return;
      }

      await PushNotificationService.removeTokenForUser(userId, token);

      res.status(200).json({
        success: true,
        message: 'تم حذف رمز الإشعارات بنجاح',
      });
    } catch (error) {
      console.error('Error removing push token:', error);
      res.status(500).json({
        success: false,
        error: 'خطأ في حذف رمز الإشعارات',
      });
    }
  }

  /**
   * Test push notification (development only)
   */
  static async testNotification(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'المستخدم غير مصرح له',
        });
        return;
      }

      await PushNotificationService.sendToUser(userId, {
        title: 'اختبار الإشعارات',
        body: 'هذا إشعار تجريبي من وظفني',
        data: {
          type: 'test',
          channelId: 'default',
        },
        channelId: 'default',
      });

      res.status(200).json({
        success: true,
        message: 'تم إرسال الإشعار التجريبي بنجاح',
      });
    } catch (error) {
      console.error('Error sending test notification:', error);
      res.status(500).json({
        success: false,
        error: 'خطأ في إرسال الإشعار التجريبي',
      });
    }
  }
}
