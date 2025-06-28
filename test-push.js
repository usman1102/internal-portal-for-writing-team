// Test script to send a push notification
const webpush = require('web-push');

// Configure VAPID keys
webpush.setVapidDetails(
  'mailto:admin@papersley.com',
  'BPU8s2AaVr8lCWfQrZGKKHc3J2d7s1R2N9HZh3_TQjF8J1K7L4P5M6N8Q9S2V3X5Y7A9B2C4E6F8H1J3K5L7N9P1',
  'mVp1qWr2eRt3yYu4iIo5pPa6sSd7fFg8hHj9kKl0zZx'
);

async function testPushNotification() {
  // Test subscription (this would normally come from your database)
  const testSubscription = {
    endpoint: 'https://fcm.googleapis.com/fcm/send/test-endpoint',
    keys: {
      p256dh: 'test-p256dh-key',
      auth: 'test-auth-key'
    }
  };

  const payload = JSON.stringify({
    title: 'Test Push Notification',
    body: 'This is a test notification from Paper Slay',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: {
      taskId: 123,
      type: 'TASK_CREATED',
      url: '/tasks?taskId=123',
      notificationId: 456,
      timestamp: Date.now()
    },
    tag: 'test-notification',
    requireInteraction: true,
    actions: [
      {
        action: 'view',
        title: 'View Task',
        icon: '/icon-32.png'
      },
      {
        action: 'mark-read',
        title: 'Mark as Read',
        icon: '/icon-32.png'
      }
    ]
  });

  try {
    console.log('Sending test push notification...');
    const result = await webpush.sendNotification(testSubscription, payload, {
      vapidDetails: {
        subject: 'mailto:admin@papersley.com',
        publicKey: 'BPU8s2AaVr8lCWfQrZGKKHc3J2d7s1R2N9HZh3_TQjF8J1K7L4P5M6N8Q9S2V3X5Y7A9B2C4E6F8H1J3K5L7N9P1',
        privateKey: 'mVp1qWr2eRt3yYu4iIo5pPa6sSd7fFg8hHj9kKl0zZx'
      },
      TTL: 24 * 60 * 60,
      urgency: 'normal'
    });
    
    console.log('Push notification sent successfully:', result);
  } catch (error) {
    console.error('Failed to send push notification:', error);
  }
}

if (require.main === module) {
  testPushNotification();
}

module.exports = { testPushNotification };