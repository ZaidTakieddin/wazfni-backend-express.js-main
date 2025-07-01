# 🔔 Push Notifications Backend Setup Guide

## Overview

This guide explains how to implement push notifications on your Express backend to work with the Expo push notification system in the React Native app.

## 📋 Prerequisites

- Express.js backend with existing FCM endpoints (`/api/v1/fcm/register` and `/api/v1/fcm/remove`)
- Expo account and project setup
- Understanding of push notification concepts

## 🚀 Implementation Steps

### 1. Install Required Packages

```bash
npm install expo-server-sdk
# or
yarn add expo-server-sdk
```

### 2. Update FCM Endpoints

The app sends Expo push tokens (not FCM tokens) to your existing endpoints. Update your FCM service to handle Expo tokens:

```javascript
// services/pushNotificationService.js
const { Expo } = require('expo-server-sdk');

class PushNotificationService {
  constructor() {
    this.expo = new Expo({
      accessToken: process.env.EXPO_ACCESS_TOKEN, // Optional: for push receipt tracking
      useFcmV1: true, // Use FCM v1 API
    });
  }

  // Validate Expo push token
  isValidExpoPushToken(token) {
    return Expo.isExpoPushToken(token);
  }

  // Send push notification to single user
  async sendNotification(pushToken, title, body, data = {}) {
    // Check if token is valid
    if (!Expo.isExpoPushToken(pushToken)) {
      console.error(`Push token ${pushToken} is not a valid Expo push token`);
      return false;
    }

    const message = {
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

  // Send notifications to multiple users
  async sendBulkNotifications(notifications) {
    // Filter valid tokens
    const validNotifications = notifications.filter(notification => 
      Expo.isExpoPushToken(notification.to)
    );

    if (validNotifications.length === 0) {
      return { success: false, message: 'No valid push tokens provided' };
    }

    try {
      // Chunk notifications (Expo recommends chunks of 100)
      const chunks = this.expo.chunkPushNotifications(validNotifications);
      const tickets = [];

      for (const chunk of chunks) {
        const ticketChunk = await this.expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      }

      return { success: true, tickets };
    } catch (error) {
      console.error('Error sending bulk notifications:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new PushNotificationService();
```

### 3. Update Your FCM Routes

```javascript
// routes/fcm.js
const express = require('express');
const router = express.Router();
const pushService = require('../services/pushNotificationService');
const auth = require('../middleware/auth'); // Your auth middleware

// Register Expo push token
router.post('/register', auth, async (req, res) => {
  try {
    const { token } = req.body;
    const userId = req.user.id;

    // Validate Expo push token
    if (!pushService.isValidExpoPushToken(token)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Expo push token'
      });
    }

    // Store token in database (update your existing logic)
    await User.findByIdAndUpdate(userId, {
      pushToken: token,
      pushTokenUpdatedAt: new Date()
    });

    res.json({
      success: true,
      message: 'Push token registered successfully'
    });
  } catch (error) {
    console.error('Error registering push token:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to register push token'
    });
  }
});

// Remove push token
router.post('/remove', auth, async (req, res) => {
  try {
    const { token } = req.body;
    const userId = req.user.id;

    // Remove token from database
    await User.findByIdAndUpdate(userId, {
      $unset: { pushToken: 1, pushTokenUpdatedAt: 1 }
    });

    res.json({
      success: true,
      message: 'Push token removed successfully'
    });
  } catch (error) {
    console.error('Error removing push token:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove push token'
    });
  }
});

module.exports = router;
```

### 4. Database Schema Updates

Add push token fields to your User model:

```javascript
// models/User.js (MongoDB/Mongoose example)
const userSchema = new mongoose.Schema({
  // ... existing fields
  pushToken: {
    type: String,
    default: null
  },
  pushTokenUpdatedAt: {
    type: Date,
    default: null
  },
  notificationSettings: {
    jobAlerts: { type: Boolean, default: true },
    applicationUpdates: { type: Boolean, default: true },
    companyUpdates: { type: Boolean, default: true }
  }
});
```

### 5. Notification Triggers

Add push notifications to your existing business logic:

```javascript
// Example: When a new job is posted
async function notifyUsersOfNewJob(job) {
  try {
    // Get users who should be notified (based on preferences, location, etc.)
    const users = await User.find({
      pushToken: { $exists: true, $ne: null },
      'notificationSettings.jobAlerts': true,
      // Add your filtering logic here
    }).select('pushToken firstName');

    const notifications = users.map(user => ({
      to: user.pushToken,
      sound: 'default',
      title: 'وظيفة جديدة متاحة!',
      body: `${job.jobTitle} في ${job.company.name}`,
      data: {
        type: 'job_alert',
        jobId: job.id,
        channelId: 'job_alerts'
      },
      channelId: 'job_alerts'
    }));

    if (notifications.length > 0) {
      await pushService.sendBulkNotifications(notifications);
      console.log(`Sent job alerts to ${notifications.length} users`);
    }
  } catch (error) {
    console.error('Error sending job alert notifications:', error);
  }
}

// Example: When application status changes
async function notifyApplicationStatusChange(application, newStatus) {
  try {
    const user = await User.findById(application.userId).select('pushToken firstName notificationSettings');
    
    if (!user?.pushToken || !user.notificationSettings.applicationUpdates) {
      return;
    }

    let title, body;
    switch (newStatus) {
      case 'ACCEPTED':
        title = 'تم قبول طلبك!';
        body = `تم قبولك في وظيفة ${application.job.jobTitle}`;
        break;
      case 'REJECTED':
        title = 'تحديث على طلبك';
        body = `تم تحديث حالة طلبك لوظيفة ${application.job.jobTitle}`;
        break;
      default:
        title = 'تحديث على طلبك';
        body = `تم تحديث حالة طلبك لوظيفة ${application.job.jobTitle}`;
    }

    await pushService.sendNotification(
      user.pushToken,
      title,
      body,
      {
        type: 'application_update',
        applicationId: application.id,
        jobId: application.job.id,
        channelId: 'application_updates'
      }
    );
  } catch (error) {
    console.error('Error sending application status notification:', error);
  }
}

// Example: When company is approved/rejected
async function notifyCompanyApprovalStatus(company, status, rejectionReason = null) {
  try {
    const user = await User.findById(company.ownerId).select('pushToken firstName');
    
    if (!user?.pushToken) return;

    let title, body;
    if (status === 'APPROVED') {
      title = 'تم الموافقة على شركتك!';
      body = `تم الموافقة على شركة ${company.name}. يمكنك الآن نشر الوظائف.`;
    } else {
      title = 'تحديث على طلب الشركة';
      body = rejectionReason || `يرجى مراجعة بيانات شركة ${company.name} وإعادة التقديم.`;
    }

    await pushService.sendNotification(
      user.pushToken,
      title,
      body,
      {
        type: 'company_approval',
        companyId: company.id,
        status,
        channelId: 'default'
      }
    );
  } catch (error) {
    console.error('Error sending company approval notification:', error);
  }
}
```

### 6. Environment Variables

Add these to your `.env` file:

```env
# Optional: Expo access token for advanced features
EXPO_ACCESS_TOKEN=your_expo_access_token_here
```

### 7. Notification Types and Data Structure

The app expects specific data structures for different notification types:

```javascript
// Job Alert Notification
{
  type: 'job_alert',
  jobId: 'job_id_here',
  channelId: 'job_alerts'
}

// Application Update Notification
{
  type: 'application_update',
  applicationId: 'application_id_here',
  jobId: 'job_id_here',
  channelId: 'application_updates'
}

// Company Approval Notification
{
  type: 'company_approval',
  companyId: 'company_id_here',
  status: 'APPROVED' | 'REJECTED',
  channelId: 'default'
}

// Custom Navigation
{
  route: '/(app)/(main)/profile', // Any valid app route
  channelId: 'default'
}
```

### 8. Error Handling and Cleanup

```javascript
// Cleanup invalid tokens
async function cleanupInvalidTokens() {
  try {
    const users = await User.find({
      pushToken: { $exists: true, $ne: null }
    });

    const invalidTokens = [];

    for (const user of users) {
      if (!pushService.isValidExpoPushToken(user.pushToken)) {
        invalidTokens.push(user.id);
      }
    }

    if (invalidTokens.length > 0) {
      await User.updateMany(
        { _id: { $in: invalidTokens } },
        { $unset: { pushToken: 1, pushTokenUpdatedAt: 1 } }
      );
      console.log(`Cleaned up ${invalidTokens.length} invalid push tokens`);
    }
  } catch (error) {
    console.error('Error cleaning up tokens:', error);
  }
}

// Run cleanup periodically (optional)
setInterval(cleanupInvalidTokens, 24 * 60 * 60 * 1000); // Daily
```

## 🔧 Testing

### Test Single Notification

```javascript
// Test endpoint (development only)
router.post('/test', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user.pushToken) {
      return res.status(400).json({ error: 'No push token registered' });
    }

    const success = await pushService.sendNotification(
      user.pushToken,
      'اختبار الإشعارات',
      'هذا إشعار تجريبي من وظفني',
      { type: 'test', channelId: 'default' }
    );

    res.json({ success, message: 'Test notification sent' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### Test with Expo CLI

```bash
# Send test notification using Expo CLI
expo push:android:upload --api-key your_expo_api_key
expo push:android:clear --api-key your_expo_api_key
```

## 🚨 Important Notes

1. **Rate Limits**: Expo has rate limits for push notifications. Implement appropriate throttling.

2. **Token Validation**: Always validate Expo push tokens before storing them.

3. **Error Handling**: Handle network errors and invalid tokens gracefully.

4. **User Preferences**: Respect user notification preferences stored in your database.

5. **Testing**: Test on physical devices only - push notifications don't work in simulators.

6. **Background Processing**: Consider using job queues (like Bull/Redis) for sending bulk notifications.

## 📱 Mobile App Integration

The React Native app automatically:
- Requests notification permissions on login
- Registers/removes push tokens with your backend
- Handles deep linking from notifications
- Manages notification channels (Android)

## 🔗 Useful Links

- [Expo Push Notifications Documentation](https://docs.expo.dev/push-notifications/overview/)
- [Expo Server SDK](https://github.com/expo/expo-server-sdk-node)
- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging) 