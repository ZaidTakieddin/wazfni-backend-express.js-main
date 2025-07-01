# 🔔 Push Notifications Backend Setup Guide

## ✅ Overview

Your Express backend already has the Expo push notification endpoints implemented! The React Native app is now fully integrated with your existing API. This guide shows you how to send notifications from your backend to users.

## 📋 Current API Implementation

Based on your API documentation, you already have:

- ✅ **POST** `/api/v1/fcm/register` - Register Expo push token
- ✅ **POST** `/api/v1/fcm/remove` - Remove Expo push token
- ✅ **POST** `/api/v1/fcm/test` - Send test notification

## 🚀 How to Send Notifications

### 1. Install Required Package (if not already installed)

```bash
npm install expo-server-sdk
# or
yarn add expo-server-sdk
```

### 2. Notification Sending Examples

Here are examples of how to send different types of notifications from your backend:

#### Job Alert Notification

```javascript
// When a new job is posted
async function sendJobAlertNotification(
  jobId,
  jobTitle,
  companyName,
  targetUsers,
) {
  const { Expo } = require('expo-server-sdk');
  const expo = new Expo();

  // Get users with valid push tokens who should receive job alerts
  const notifications = targetUsers
    .filter((user) => user.pushToken && Expo.isExpoPushToken(user.pushToken))
    .map((user) => ({
      to: user.pushToken,
      sound: 'default',
      title: 'وظيفة جديدة متاحة!',
      body: `${jobTitle} في ${companyName}`,
      data: {
        type: 'job_alert',
        jobId: jobId,
        channelId: 'job_alerts',
      },
      channelId: 'job_alerts',
    }));

  if (notifications.length > 0) {
    try {
      const chunks = expo.chunkPushNotifications(notifications);
      for (const chunk of chunks) {
        await expo.sendPushNotificationsAsync(chunk);
      }
      console.log(`Sent job alerts to ${notifications.length} users`);
    } catch (error) {
      console.error('Error sending job alerts:', error);
    }
  }
}
```

#### Application Status Update

```javascript
// When application status changes (ACCEPTED/REJECTED)
async function sendApplicationStatusNotification(userId, jobTitle, status) {
  const { Expo } = require('expo-server-sdk');
  const expo = new Expo();

  // Get user's push token
  const user = await User.findById(userId).select('pushToken firstName');

  if (!user?.pushToken || !Expo.isExpoPushToken(user.pushToken)) {
    return;
  }

  let title, body;
  switch (status) {
    case 'ACCEPTED':
      title = 'تم قبول طلبك! 🎉';
      body = `تم قبولك في وظيفة ${jobTitle}. تهانينا!`;
      break;
    case 'REJECTED':
      title = 'تحديث على طلبك';
      body = `تم تحديث حالة طلبك لوظيفة ${jobTitle}`;
      break;
    default:
      title = 'تحديث على طلبك';
      body = `تم تحديث حالة طلبك لوظيفة ${jobTitle}`;
  }

  const message = {
    to: user.pushToken,
    sound: 'default',
    title: title,
    body: body,
    data: {
      type: 'application_update',
      status: status,
      channelId: 'application_updates',
    },
    channelId: 'application_updates',
  };

  try {
    await expo.sendPushNotificationsAsync([message]);
    console.log(`Sent application status notification to user ${userId}`);
  } catch (error) {
    console.error('Error sending application status notification:', error);
  }
}
```

#### Company Approval Notification

```javascript
// When company is approved or rejected
async function sendCompanyApprovalNotification(
  companyOwnerId,
  companyName,
  status,
  rejectionReason = null,
) {
  const { Expo } = require('expo-server-sdk');
  const expo = new Expo();

  const user = await User.findById(companyOwnerId).select(
    'pushToken firstName',
  );

  if (!user?.pushToken || !Expo.isExpoPushToken(user.pushToken)) {
    return;
  }

  let title, body;
  if (status === 'APPROVED') {
    title = 'تم الموافقة على شركتك! ✅';
    body = `تم الموافقة على شركة ${companyName}. يمكنك الآن نشر الوظائف.`;
  } else {
    title = 'تحديث على طلب الشركة ❌';
    body =
      rejectionReason ||
      `يرجى مراجعة بيانات شركة ${companyName} وإعادة التقديم.`;
  }

  const message = {
    to: user.pushToken,
    sound: 'default',
    title: title,
    body: body,
    data: {
      type: 'company_approval',
      status: status,
      companyName: companyName,
      channelId: 'default',
    },
    channelId: 'default',
  };

  try {
    await expo.sendPushNotificationsAsync([message]);
    console.log(`Sent company approval notification to user ${companyOwnerId}`);
  } catch (error) {
    console.error('Error sending company approval notification:', error);
  }
}
```

### 3. Integration Points in Your Backend

Add these notification calls to your existing business logic:

```javascript
// In your job creation endpoint
app.post('/api/v1/jobs/company', async (req, res) => {
  try {
    // ... your existing job creation logic
    const newJob = await createJob(jobData);

    // Send notifications to relevant users
    const interestedUsers = await findUsersInterestedInJob(newJob);
    await sendJobAlertNotification(
      newJob.id,
      newJob.jobTitle,
      newJob.company.name,
      interestedUsers,
    );

    res.json({ success: true, job: newJob });
  } catch (error) {
    // ... error handling
  }
});

// In your application status update endpoint
app.patch('/api/v1/applications/:applicationId/status', async (req, res) => {
  try {
    // ... your existing status update logic
    const { status } = req.body;
    const application = await updateApplicationStatus(applicationId, status);

    // Send notification to applicant
    await sendApplicationStatusNotification(
      application.userId,
      application.job.jobTitle,
      status,
    );

    res.json({ success: true, application });
  } catch (error) {
    // ... error handling
  }
});

// In your company approval endpoint
app.patch(
  '/api/v1/admin/approval/companies/:companyId/approve',
  async (req, res) => {
    try {
      // ... your existing approval logic
      const company = await approveCompany(companyId);

      // Send notification to company owner
      await sendCompanyApprovalNotification(
        company.ownerId,
        company.name,
        'APPROVED',
      );

      res.json({ success: true, company });
    } catch (error) {
      // ... error handling
    }
  },
);
```

## 🧪 Testing

### Frontend Test Button

You can add this test button to any screen during development:

```tsx
import NotificationTestButton from '@/components/notifications/NotificationTestButton';

// In your component
<NotificationTestButton style={{ margin: 20 }} />;
```

### Backend Test Endpoint

Your existing `/api/v1/fcm/test` endpoint should send a test notification like this:

```javascript
app.post('/api/v1/fcm/test', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('pushToken firstName');

    if (!user.pushToken) {
      return res.status(400).json({
        success: false,
        error: 'لا يوجد رمز إشعارات مسجل',
      });
    }

    const { Expo } = require('expo-server-sdk');
    const expo = new Expo();

    if (!Expo.isExpoPushToken(user.pushToken)) {
      return res.status(400).json({
        success: false,
        error: 'رمز إشعارات غير صحيح',
      });
    }

    const message = {
      to: user.pushToken,
      sound: 'default',
      title: 'اختبار الإشعارات 📱',
      body: `مرحباً ${user.firstName}! هذا إشعار تجريبي من تطبيق وظفني`,
      data: {
        type: 'test',
        channelId: 'default',
      },
      channelId: 'default',
    };

    await expo.sendPushNotificationsAsync([message]);

    res.json({
      success: true,
      message: 'تم إرسال الإشعار التجريبي بنجاح',
    });
  } catch (error) {
    console.error('Test notification error:', error);
    res.status(500).json({
      success: false,
      error: 'فشل في إرسال الإشعار التجريبي',
    });
  }
});
```

## 📱 Navigation Mapping

The app automatically navigates to appropriate screens based on notification `data.type`:

| Notification Type    | Navigation Target               |
| -------------------- | ------------------------------- |
| `job_alert`          | `/(app)/(job)/details/[jobId]`  |
| `application_update` | `/(app)/(main)/applied-jobs`    |
| `company_approval`   | `/(app)/(main)/profile`         |
| Custom `data.route`  | Any specified route             |
| Default              | `/(app)/(others)/notifications` |

## 🔧 Environment Variables

Add to your `.env` file (optional):

```env
# Optional: Expo access token for advanced features
EXPO_ACCESS_TOKEN=your_expo_access_token_here
```

## 📊 Best Practices

1. **Rate Limiting**: Don't spam users with too many notifications
2. **Timing**: Send notifications at appropriate times (not 3 AM)
3. **Relevance**: Only send notifications that are actually useful to the user
4. **Localization**: Your API already returns Arabic messages, which is perfect
5. **Error Handling**: Always handle invalid/expired tokens gracefully

## ✅ Current Status

- ✅ Frontend fully implemented and integrated
- ✅ Backend API endpoints ready
- ✅ Notification types defined and documented
- ✅ Test functionality available
- ✅ Arabic language support
- ✅ Deep linking navigation setup

Your push notification system is **ready to use**! Just add the notification sending calls to your existing business logic as shown in the examples above.
