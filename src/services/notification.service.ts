import admin from '../config/firebase';
import prisma from '../config/prisma';
import { Role } from '@prisma/client';

interface NotificationPayload {
  title: string;
  body: string;
  data?: { [key: string]: string };
}

export class NotificationService {
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
        console.log(`No FCM tokens found for user ${userId}`);
        return;
      }

      await this.sendToTokens(user.fcmTokens, payload);
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

      if (allTokens.length === 0) {
        console.log('No FCM tokens found for admins');
        return;
      }

      await this.sendToTokens(allTokens, payload);
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

      if (allTokens.length === 0) {
        console.log('No FCM tokens found for interested users');
        return;
      }

      await this.sendToTokens(allTokens, payload);
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
        console.log(`No FCM tokens found for company owner ${companyId}`);
        return;
      }

      await this.sendToTokens(company.user.fcmTokens, payload);
    } catch (error) {
      console.error('Error sending notification to company owner:', error);
    }
  }

  /**
   * Send notification to multiple FCM tokens
   */
  private static async sendToTokens(
    tokens: string[],
    payload: NotificationPayload,
  ): Promise<void> {
    try {
      const message = {
        notification: {
          title: payload.title,
          body: payload.body,
        },
        data: payload.data || {},
        tokens: tokens,
      };

      const response = await admin.messaging().sendEachForMulticast(message);

      // Handle failed tokens (remove invalid ones)
      if (response.failureCount > 0) {
        const failedTokens: string[] = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success && tokens[idx]) {
            failedTokens.push(tokens[idx]);
            console.error(
              `Failed to send to token ${tokens[idx]}:`,
              resp.error,
            );
          }
        });

        // Remove invalid tokens from database
        await this.removeInvalidTokens(failedTokens);
      }

      console.log(`Successfully sent ${response.successCount} notifications`);
    } catch (error) {
      console.error('Error sending notifications:', error);
    }
  }

  /**
   * Remove invalid FCM tokens from database
   */
  private static async removeInvalidTokens(
    invalidTokens: string[],
  ): Promise<void> {
    try {
      for (const token of invalidTokens) {
        await prisma.user.updateMany({
          where: {
            fcmTokens: {
              has: token,
            },
          },
          data: {
            fcmTokens: {
              set: [], // Will be replaced by array without the invalid token
            },
          },
        });

        // Update with filtered tokens
        const usersWithToken = await prisma.user.findMany({
          where: {
            fcmTokens: {
              has: token,
            },
          },
        });

        for (const user of usersWithToken) {
          const filteredTokens = user.fcmTokens.filter((t) => t !== token);
          await prisma.user.update({
            where: { id: user.id },
            data: { fcmTokens: filteredTokens },
          });
        }
      }
    } catch (error) {
      console.error('Error removing invalid tokens:', error);
    }
  }

  /**
   * Add FCM token for a user
   */
  static async addTokenForUser(userId: string, token: string): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { fcmTokens: true },
      });

      if (!user) {
        throw new Error('User not found');
      }

      const currentTokens = user.fcmTokens || [];

      // Add token if it doesn't already exist
      if (!currentTokens.includes(token)) {
        await prisma.user.update({
          where: { id: userId },
          data: {
            fcmTokens: [...currentTokens, token],
          },
        });
      }
    } catch (error) {
      console.error('Error adding FCM token:', error);
      throw error;
    }
  }

  /**
   * Remove FCM token for a user
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

      if (!user) {
        throw new Error('User not found');
      }

      const filteredTokens = (user.fcmTokens || []).filter((t) => t !== token);

      await prisma.user.update({
        where: { id: userId },
        data: {
          fcmTokens: filteredTokens,
        },
      });
    } catch (error) {
      console.error('Error removing FCM token:', error);
      throw error;
    }
  }
}

// Notification templates
export const NotificationTemplates = {
  // For admins when company is created
  newCompanyForReview: (companyName: string) => ({
    title: 'شركة جديدة تحتاج للمراجعة',
    body: `تم تسجيل شركة جديدة "${companyName}" وتحتاج للمراجعة والموافقة`,
    data: {
      type: 'company_review',
      action: 'review_company',
    },
  }),

  // For admins when job is posted
  newJobForReview: (jobTitle: string, companyName: string) => ({
    title: 'وظيفة جديدة تحتاج للمراجعة',
    body: `تم نشر وظيفة "${jobTitle}" من شركة "${companyName}" وتحتاج للمراجعة`,
    data: {
      type: 'job_review',
      action: 'review_job',
    },
  }),

  // For company when someone applies
  newApplication: (jobTitle: string, applicantName: string) => ({
    title: 'طلب توظيف جديد',
    body: `تقدم ${applicantName} بطلب للوظيفة "${jobTitle}"`,
    data: {
      type: 'application',
      action: 'view_applications',
    },
  }),

  // For users about recommended jobs
  recommendedJob: (jobTitle: string, companyName: string) => ({
    title: 'وظيفة جديدة قد تهمك',
    body: `وظيفة "${jobTitle}" في شركة "${companyName}" تناسب اهتماماتك`,
    data: {
      type: 'recommendation',
      action: 'view_job',
    },
  }),

  // For company when their company is approved
  companyApproved: (companyName: string) => ({
    title: 'تم قبول شركتك',
    body: `تم الموافقة على شركة "${companyName}" ويمكنك الآن نشر الوظائف`,
    data: {
      type: 'company_approved',
      action: 'post_jobs',
    },
  }),

  // For company when their company is rejected
  companyRejected: (companyName: string, reason: string) => ({
    title: 'تم رفض شركتك',
    body: `تم رفض شركة "${companyName}". السبب: ${reason}`,
    data: {
      type: 'company_rejected',
      action: 'contact_support',
    },
  }),

  // For company when their job is approved
  jobApproved: (jobTitle: string) => ({
    title: 'تم قبول الوظيفة',
    body: `تم الموافقة على وظيفة "${jobTitle}" وهي الآن متاحة للباحثين عن عمل`,
    data: {
      type: 'job_approved',
      action: 'view_job',
    },
  }),

  // For company when their job is rejected
  jobRejected: (jobTitle: string, reason: string) => ({
    title: 'تم رفض الوظيفة',
    body: `تم رفض وظيفة "${jobTitle}". السبب: ${reason}`,
    data: {
      type: 'job_rejected',
      action: 'edit_job',
    },
  }),
};
