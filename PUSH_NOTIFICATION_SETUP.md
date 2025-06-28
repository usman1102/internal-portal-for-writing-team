# Push Notification Setup Guide

This document explains the background push notification setup for Paper Slay PWA.

## Current Status

✅ **Service Worker**: Properly configured with push event handlers
✅ **VAPID Keys**: Real keys configured via environment variables
✅ **Notification API**: Full implementation with click handling and actions
✅ **Background Sync**: Queue management for offline scenarios
✅ **Deep Linking**: Notifications open app to specific tasks
✅ **Real Push Support**: Direct VAPID-based push notifications (no FCM required)

## How It Works

### Direct VAPID Push Notifications

The system uses direct VAPID-based push notifications without requiring Firebase:

1. **VAPID Keys**: Configured via environment variables
   - `VAPID_PUBLIC_KEY`: Browser subscription key
   - `VAPID_PRIVATE_KEY`: Server signing key  
   - `VAPID_EMAIL`: Contact email for push service

2. **Push Flow**:
   - User enables notifications → Browser subscribes with VAPID public key
   - Server stores subscription → Links to user account
   - Events trigger notifications → Server sends push via web-push library
   - Service worker receives push → Shows notification even when app closed

3. **No Firebase Required**: Direct browser push API communication

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