# Push Notification Setup Guide

This document explains how to set up real background push notifications for Paper Slay PWA.

## Current Status

✅ **Service Worker**: Properly configured with push event handlers
✅ **VAPID Keys**: Generated and configured for secure messaging
✅ **Notification API**: Full implementation with click handling and actions
✅ **Background Sync**: Queue management for offline scenarios
✅ **Deep Linking**: Notifications open app to specific tasks

## For Real Push Notifications (Production)

### 1. Firebase Cloud Messaging (FCM) Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or use existing one
3. Go to Project Settings > Cloud Messaging
4. Generate a new web push certificate
5. Copy the "Server key" and "Sender ID"

### 2. Update Configuration

Update `public/manifest.json`:
```json
{
  "gcm_sender_id": "YOUR_FIREBASE_SENDER_ID"
}
```

Update VAPID keys in `server/notification-service.ts`:
```javascript
webpush.setVapidDetails(
  'mailto:your-email@domain.com',
  'YOUR_FIREBASE_WEB_PUSH_PUBLIC_KEY',
  'YOUR_FIREBASE_WEB_PUSH_PRIVATE_KEY'
);
```

Update public key in `client/src/components/notifications/push-notification-setup.tsx`:
```javascript
applicationServerKey: urlB64ToUint8Array('YOUR_FIREBASE_WEB_PUSH_PUBLIC_KEY')
```

### 3. Testing Background Notifications

1. **Install as PWA**: Add app to home screen on mobile Chrome
2. **Enable Notifications**: Use the push notification setup component
3. **Test Scenarios**:
   - Close the app completely
   - Lock the device screen
   - Switch to other apps
   - Create/assign tasks to trigger notifications

### 4. Real Device Testing

For actual background push notification testing, you need:

1. **Real FCM endpoint**: Not test/fake endpoints
2. **HTTPS domain**: Push notifications require secure context
3. **Mobile device**: With Chrome browser or PWA installed
4. **Valid VAPID keys**: From Firebase console

## Current Test Implementation

The current setup uses test endpoints and will:
- Show notifications when app is open (via WebSocket)
- Log push attempts to console
- Demonstrate notification UI and click handling
- Skip actual FCM sending for test endpoints

## Troubleshooting

### Notifications Not Appearing
1. Check browser notification permissions
2. Verify service worker is registered
3. Ensure HTTPS connection (required for push notifications)
4. Check browser console for errors

### Background Notifications Not Working
1. Verify FCM configuration
2. Check VAPID keys are correct
3. Ensure app is installed as PWA
4. Test on physical device (not desktop browser)

### Permission Issues
1. Reset browser permissions in settings
2. Clear site data and re-register
3. Test in incognito mode first

## Important Notes

- **Desktop browsers**: Limited background notification support
- **iOS Safari**: No background push support (need PWA installation)
- **Android Chrome**: Best support for background notifications
- **Development**: Use test endpoints to avoid FCM quota limits

## Code Structure

- `public/sw.js`: Service worker with push event handlers
- `server/notification-service.ts`: Server-side push notification logic
- `client/src/components/notifications/`: UI components for notification management
- `client/src/hooks/use-notifications.tsx`: React hooks for notification state

## Security Considerations

- VAPID keys should be kept secure
- Use environment variables in production
- Implement rate limiting for notifications
- Validate all subscription endpoints