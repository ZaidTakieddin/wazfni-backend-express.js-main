import { Expo, ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk';
import prisma from '../config/prisma';
import { Role } from '@prisma/client';

interface NotificationPayload {
  title: string;
  body: string;
  data?: { [key: string]: any };
  channelId?: string;
}

export class PushNotificationService {
  private static expo = new Expo({
    accessToken: process.env.EXPO_ACCESS_TOKEN, // Optional: for push receipt tracking
    useFcmV1: true, // Use FCM v1 API
  });

  /**
   * Validate Expo push token
   */
  static isValidExpoPushToken(token: string): boolean {
    return Expo.isExpoPushToken(token);
  }

  /**
   * Send push notification to single user
   */
  static async sendNotification(
    pushToken: string,
    title: string,
    body: string,
    data: { [key: string]: any } = {},
  ): Promise<boolean> {
    // Check if token is valid
    if (!Expo.isExpoPushToken(pushToken)) {
      console.error(`Push token ${pushToken} is not a valid Expo push token`);
      return false;
    }

    const message: ExpoPushMessage = {
      to: pushToken,
      sound: 'default',
      title,
      body,
      data,
      channelId: data.channelId || 'default', // Android channel
    };

    try {
      const ticketChunk = await this.expo.sendPushNotificationsAsync([message]);
      console.log('Push notification sent:', ticketChunk);
      return true;
    } catch (error) {
      console.error('Error sending push notification:', error);
      return false;
    }
  }

  /**
   * Send notifications to multiple users
   */
  static async sendBulkNotifications(
    notifications: ExpoPushMessage[],
  ): Promise<{
    success: boolean;
    tickets?: ExpoPushTicket[];
    message?: string;
    error?: string;
  }> {
    // Filter valid tokens
    const validNotifications = notifications.filter((notification) =>
      Expo.isExpoPushToken(notification.to as string),
    );

    if (validNotifications.length === 0) {
      return { success: false, message: 'No valid push tokens provided' };
    }

    try {
      // Chunk notifications (Expo recommends chunks of 100)
      const chunks = this.expo.chunkPushNotifications(validNotifications);
      const tickets: ExpoPushTicket[] = [];

      for (const chunk of chunks) {
        const ticketChunk = await this.expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      }

      return { success: true, tickets };
    } catch (error) {
      console.error('Error sending bulk notifications:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Send notification to specific user by ID
   */
  static async sendToUser(
    userId: string,
    payload: NotificationPayload,
  ): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { fcmTokens: true },
      });

      if (!user || !user.fcmTokens || user.fcmTokens.length === 0) {
        console.log(`No push tokens found for user ${userId}`);
        return;
      }

      const notifications: ExpoPushMessage[] = user.fcmTokens
        .filter((token) => this.isValidExpoPushToken(token))
        .map((token) => ({
          to: token,
          sound: 'default',
          title: payload.title,
          body: payload.body,
          data: payload.data || {},
          channelId: payload.channelId || 'default',
        }));

      if (notifications.length > 0) {
        await this.sendBulkNotifications(notifications);
      }
    } catch (error) {
      console.error('Error sending notification to user:', error);
    }
  }

  /**
   * Send notification to all admins
   */
  static async sendToAdmins(payload: NotificationPayload): Promise<void> {
    try {
      const admins = await prisma.user.findMany({
        where: { role: Role.ADMIN },
        select: { fcmTokens: true },
      });

      const allTokens = admins.flatMap((admin) => admin.fcmTokens || []);
      const validTokens = allTokens.filter((token) =>
        this.isValidExpoPushToken(token),
      );

      if (validTokens.length === 0) {
        console.log('No valid push tokens found for admins');
        return;
      }

      const notifications: ExpoPushMessage[] = validTokens.map((token) => ({
        to: token,
        sound: 'default',
        title: payload.title,
        body: payload.body,
        data: payload.data || {},
        channelId: payload.channelId || 'default',
      }));

      await this.sendBulkNotifications(notifications);
    } catch (error) {
      console.error('Error sending notification to admins:', error);
    }
  }

  /**
   * Send notification to users interested in specific subcategories
   */
  static async sendToInterestedUsers(
    subCategoryIds: string[],
    payload: NotificationPayload,
  ): Promise<void> {
    try {
      // Get users who have clicked on these subcategories
      const interestedUsers = await prisma.user.findMany({
        where: {
          categoryClicks: {
            some: {
              subCategoryId: {
                in: subCategoryIds,
              },
            },
          },
        },
        select: {
          id: true,
          fcmTokens: true,
        },
        distinct: ['id'],
      });

      const allTokens = interestedUsers.flatMap((user) => user.fcmTokens || []);
      const validTokens = allTokens.filter((token) =>
        this.isValidExpoPushToken(token),
      );

      if (validTokens.length === 0) {
        console.log('No valid push tokens found for interested users');
        return;
      }

      const notifications: ExpoPushMessage[] = validTokens.map((token) => ({
        to: token,
        sound: 'default',
        title: payload.title,
        body: payload.body,
        data: payload.data || {},
        channelId: payload.channelId || 'job_alerts',
      }));

      await this.sendBulkNotifications(notifications);
    } catch (error) {
      console.error('Error sending notification to interested users:', error);
    }
  }

  /**
   * Send notification to company owner
   */
  static async sendToCompanyOwner(
    companyId: string,
    payload: NotificationPayload,
  ): Promise<void> {
    try {
      const company = await prisma.company.findUnique({
        where: { id: companyId },
        include: {
          user: {
            select: { fcmTokens: true },
          },
        },
      });

      if (
        !company ||
        !company.user.fcmTokens ||
        company.user.fcmTokens.length === 0
      ) {
        console.log(`No push tokens found for company owner ${companyId}`);
        return;
      }

      const validTokens = company.user.fcmTokens.filter((token) =>
        this.isValidExpoPushToken(token),
      );

      if (validTokens.length === 0) {
        console.log(
          `No valid push tokens found for company owner ${companyId}`,
        );
        return;
      }

      const notifications: ExpoPushMessage[] = validTokens.map((token) => ({
        to: token,
        sound: 'default',
        title: payload.title,
        body: payload.body,
        data: payload.data || {},
        channelId: payload.channelId || 'default',
      }));

      await this.sendBulkNotifications(notifications);
    } catch (error) {
      console.error('Error sending notification to company owner:', error);
    }
  }

  /**
   * Add token for user (validates Expo token)
   */
  static async addTokenForUser(userId: string, token: string): Promise<void> {
    if (!this.isValidExpoPushToken(token)) {
      throw new Error('Invalid Expo push token');
    }

    try {
      // Check if user already has this token
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { fcmTokens: true },
      });

      if (user && user.fcmTokens.includes(token)) {
        console.log(`Token already exists for user ${userId}`);
        return;
      }

      // Add token to user's fcmTokens array
      await prisma.user.update({
        where: { id: userId },
        data: {
          fcmTokens: {
            push: token,
          },
        },
      });

      console.log(`Added push token for user ${userId}`);
    } catch (error) {
      console.error('Error adding token for user:', error);
      throw error;
    }
  }

  /**
   * Remove token for user
   */
  static async removeTokenForUser(
    userId: string,
    token: string,
  ): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { fcmTokens: true },
      });

      if (!user || !user.fcmTokens.includes(token)) {
        console.log(`Token not found for user ${userId}`);
        return;
      }

      // Remove token from user's fcmTokens array
      const updatedTokens = user.fcmTokens.filter((t) => t !== token);

      await prisma.user.update({
        where: { id: userId },
        data: {
          fcmTokens: updatedTokens,
        },
      });

      console.log(`Removed push token for user ${userId}`);
    } catch (error) {
      console.error('Error removing token for user:', error);
      throw error;
    }
  }

  /**
   * Cleanup invalid tokens
   */
  static async cleanupInvalidTokens(): Promise<void> {
    try {
      const users = await prisma.user.findMany({
        where: {
          fcmTokens: {
            isEmpty: false,
          },
        },
        select: {
          id: true,
          fcmTokens: true,
        },
      });

      let totalCleaned = 0;

      for (const user of users) {
        const validTokens = user.fcmTokens.filter((token) =>
          this.isValidExpoPushToken(token),
        );

        if (validTokens.length !== user.fcmTokens.length) {
          await prisma.user.update({
            where: { id: user.id },
            data: { fcmTokens: validTokens },
          });
          totalCleaned += user.fcmTokens.length - validTokens.length;
        }
      }

      if (totalCleaned > 0) {
        console.log(`Cleaned up ${totalCleaned} invalid push tokens`);
      }
    } catch (error) {
      console.error('Error cleaning up tokens:', error);
    }
  }

  // Notification helper methods for different use cases

  /**
   * Notify users of new job alert
   */
  static async notifyUsersOfNewJob(job: any): Promise<void> {
    try {
      // Get users who should be notified (based on preferences, location, etc.)
      const users = await prisma.user.findMany({
        where: {
          fcmTokens: {
            isEmpty: false,
          },
          // Add your filtering logic here based on user preferences
        },
        select: { fcmTokens: true, firstName: true },
      });

      const notifications: ExpoPushMessage[] = [];

      users.forEach((user) => {
        user.fcmTokens
          .filter((token) => this.isValidExpoPushToken(token))
          .forEach((token) => {
            notifications.push({
              to: token,
              sound: 'default',
              title: 'وظيفة جديدة متاحة!',
              body: `${job.jobTitle} في ${job.company?.name}`,
              data: {
                type: 'job_alert',
                jobId: job.id,
                channelId: 'job_alerts',
              },
              channelId: 'job_alerts',
            });
          });
      });

      if (notifications.length > 0) {
        await this.sendBulkNotifications(notifications);
        console.log(`Sent job alerts to ${notifications.length} tokens`);
      }
    } catch (error) {
      console.error('Error sending job alert notifications:', error);
    }
  }

  /**
   * Notify application status change
   */
  static async notifyApplicationStatusChange(
    application: any,
    newStatus: string,
  ): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: application.userId },
        select: { fcmTokens: true, firstName: true },
      });

      if (!user || user.fcmTokens.length === 0) {
        return;
      }

      let title: string, body: string;
      switch (newStatus) {
        case 'ACCEPTED':
          title = 'تم قبول طلبك!';
          body = `تم قبولك في وظيفة ${application.job?.jobTitle}`;
          break;
        case 'REJECTED':
          title = 'تحديث على طلبك';
          body = `تم تحديث حالة طلبك لوظيفة ${application.job?.jobTitle}`;
          break;
        default:
          title = 'تحديث على طلبك';
          body = `تم تحديث حالة طلبك لوظيفة ${application.job?.jobTitle}`;
      }

      const validTokens = user.fcmTokens.filter((token) =>
        this.isValidExpoPushToken(token),
      );

      for (const token of validTokens) {
        await this.sendNotification(token, title, body, {
          type: 'application_update',
          applicationId: application.id,
          jobId: application.job?.id,
          channelId: 'application_updates',
        });
      }
    } catch (error) {
      console.error('Error sending application status notification:', error);
    }
  }

  /**
   * Notify company approval status
   */
  static async notifyCompanyApprovalStatus(
    company: any,
    status: string,
    rejectionReason: string | null = null,
  ): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: company.ownerId },
        select: { fcmTokens: true, firstName: true },
      });

      if (!user || user.fcmTokens.length === 0) return;

      let title: string, body: string;
      if (status === 'APPROVED') {
        title = 'تم الموافقة على شركتك!';
        body = `تم الموافقة على شركة ${company.name}. يمكنك الآن نشر الوظائف.`;
      } else {
        title = 'تحديث على طلب الشركة';
        body =
          rejectionReason ||
          `يرجى مراجعة بيانات شركة ${company.name} وإعادة التقديم.`;
      }

      const validTokens = user.fcmTokens.filter((token) =>
        this.isValidExpoPushToken(token),
      );

      for (const token of validTokens) {
        await this.sendNotification(token, title, body, {
          type: 'company_approval',
          companyId: company.id,
          status,
          channelId: 'default',
        });
      }
    } catch (error) {
      console.error('Error sending company approval notification:', error);
    }
  }

  /**
   * Notify job approval status
   */
  static async notifyJobApprovalStatus(
    job: any,
    status: string,
    rejectionReason: string | null = null,
  ): Promise<void> {
    try {
      const company = await prisma.company.findUnique({
        where: { id: job.companyId },
        include: {
          user: {
            select: { fcmTokens: true, firstName: true },
          },
        },
      });

      if (!company || company.user.fcmTokens.length === 0) return;

      let title: string, body: string;
      if (status === 'APPROVED') {
        title = 'تم الموافقة على الوظيفة!';
        body = `تم الموافقة على وظيفة ${job.jobTitle}. يمكن للمتقدمين رؤيتها الآن.`;
      } else {
        title = 'تحديث على طلب الوظيفة';
        body =
          rejectionReason ||
          `يرجى مراجعة بيانات وظيفة ${job.jobTitle} وإعادة التقديم.`;
      }

      const validTokens = company.user.fcmTokens.filter((token) =>
        this.isValidExpoPushToken(token),
      );

      for (const token of validTokens) {
        await this.sendNotification(token, title, body, {
          type: 'job_approval',
          jobId: job.id,
          companyId: company.id,
          status,
          channelId: 'default',
        });
      }
    } catch (error) {
      console.error('Error sending job approval notification:', error);
    }
  }
}

// Run cleanup periodically (optional)
setInterval(
  () => {
    PushNotificationService.cleanupInvalidTokens();
  },
  24 * 60 * 60 * 1000,
); // Daily
