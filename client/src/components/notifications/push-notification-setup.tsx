import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Bell, BellOff, Smartphone, Monitor } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
// Convert base64 VAPID key to Uint8Array
function urlB64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Check if device supports push notifications
function isPushNotificationSupported(): boolean {
  return 'serviceWorker' in navigator && 
         'PushManager' in window && 
         'Notification' in window;
}

// Check if running as PWA
function isPWA(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches ||
         window.navigator.standalone === true ||
         document.referrer.includes('android-app://');
}

// Check if device is mobile
function isMobileDevice(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Check if browser is Chrome
function isChromeBrowser(): boolean {
  return /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
}

export function PushNotificationSetup() {
  const { user } = useAuth();
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [pushSubscription, setPushSubscription] = useState<PushSubscription | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const [setupError, setSetupError] = useState<string | null>(null);

  // Check support and current state
  useEffect(() => {
    const checkSupport = async () => {
      const supported = isPushNotificationSupported();
      setIsSupported(supported);
      
      if ('Notification' in window) {
        setNotificationPermission(Notification.permission);
      }

      if (supported) {
        try {
          // Wait for service worker to be ready
          const registration = await navigator.serviceWorker.ready;
          const subscription = await registration.pushManager.getSubscription();
          setPushSubscription(subscription);
          console.log('Current push subscription:', subscription);
        } catch (error) {
          console.error('Error checking push subscription:', error);
        }
      }
    };

    checkSupport();
  }, []);

  // Subscribe to push notifications
  const subscribeMutation = useMutation({
    mutationFn: async () => {
      setSetupError(null);
      
      // Request permission
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      
      if (permission !== 'granted') {
        throw new Error('Notification permission denied');
      }

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;
      
      // Subscribe to push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlB64ToUint8Array('BPU8s2AaVr8lCWfQrZGKKHc3J2d7s1R2N9HZh3_TQjF8J1K7L4P5M6N8Q9S2V3X5Y7A9B2C4E6F8H1J3K5L7N9P1')
      });

      // Send subscription to server
      await apiRequest('POST', '/api/push-subscription', subscription.toJSON());
      
      setPushSubscription(subscription);
      
      // Notify service worker
      if (registration.active) {
        registration.active.postMessage({
          type: 'NOTIFICATION_PERMISSION_GRANTED'
        });
      }
      
      return subscription;
    },
    onError: (error) => {
      setSetupError(error.message);
    }
  });

  // Unsubscribe from push notifications
  const unsubscribeMutation = useMutation({
    mutationFn: async () => {
      if (pushSubscription) {
        await pushSubscription.unsubscribe();
        await apiRequest('DELETE', '/api/push-subscription', {});
        setPushSubscription(null);
      }
    }
  });

  // Only show on mobile Chrome or PWA
  const shouldShow = isMobileDevice() && (isChromeBrowser() || isPWA());
  
  if (!user || !isSupported || !shouldShow) {
    return null; // Don't show the component if not applicable
  }

  const isSubscribed = pushSubscription !== null;
  const hasPermission = notificationPermission === 'granted';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isSubscribed ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
          Push Notifications
        </CardTitle>
        <CardDescription>
          Get notified about task updates even when the app is closed
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Permission status */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            <Smartphone className="h-4 w-4" />
            <span className="text-sm">Browser Permission</span>
          </div>
          <span className={`text-sm font-medium ${
            hasPermission ? 'text-green-600' : 'text-gray-600'
          }`}>
            {hasPermission ? 'Granted' : 'Not granted'}
          </span>
        </div>

        {/* Subscription status */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            <Monitor className="h-4 w-4" />
            <span className="text-sm">Push Subscription</span>
          </div>
          <span className={`text-sm font-medium ${
            isSubscribed ? 'text-green-600' : 'text-gray-600'
          }`}>
            {isSubscribed ? 'Active' : 'Inactive'}
          </span>
        </div>

        {/* Error message */}
        {setupError && (
          <Alert variant="destructive">
            <AlertDescription>{setupError}</AlertDescription>
          </Alert>
        )}

        {/* Action buttons */}
        <div className="flex gap-2">
          {!isSubscribed ? (
            <Button 
              onClick={() => subscribeMutation.mutate()}
              disabled={subscribeMutation.isPending}
              className="flex-1"
            >
              {subscribeMutation.isPending ? 'Setting up...' : 'Enable Notifications'}
            </Button>
          ) : (
            <Button 
              variant="outline"
              onClick={() => unsubscribeMutation.mutate()}
              disabled={unsubscribeMutation.isPending}
              className="flex-1"
            >
              {unsubscribeMutation.isPending ? 'Disabling...' : 'Disable Notifications'}
            </Button>
          )}
        </div>

        {/* iOS PWA note */}
        {navigator.userAgent.includes('iPhone') && (
          <Alert>
            <AlertDescription className="text-xs">
              On iOS, notifications work best when this app is installed to your home screen.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}