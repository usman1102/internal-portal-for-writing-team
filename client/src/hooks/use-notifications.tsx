import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "./use-auth";
import { useEffect, useRef } from "react";

export interface Notification {
  id: number;
  userId: number;
  type: string;
  title: string;
  message: string;
  relatedTaskId?: number;
  relatedUserId?: number;
  isRead: boolean;
  createdAt: string;
  metadata?: any;
}

// WebSocket connection for real-time notifications
let ws: WebSocket | null = null;

export function useNotifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);

  // Fetch notifications
  const {
    data: notifications = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['/api/notifications'],
    enabled: !!user
  });

  // Fetch unread count
  const {
    data: unreadData,
    isLoading: countLoading
  } = useQuery({
    queryKey: ['/api/notifications/unread-count'],
    enabled: !!user,
    refetchInterval: 30000 // Refetch every 30 seconds
  });

  const unreadCount = (unreadData as any)?.count || 0;

  // Mark notification as read
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to mark notification as read');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread-count'] });
    }
  });

  // Mark all notifications as read
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'PATCH',
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to mark all notifications as read');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread-count'] });
    }
  });

  // WebSocket connection for real-time updates
  useEffect(() => {
    if (!user) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    try {
      const websocket = new WebSocket(wsUrl);
      wsRef.current = websocket;

      websocket.onopen = () => {
        console.log('WebSocket connected for notifications');
        // Authenticate with user ID
        websocket.send(JSON.stringify({
          type: 'auth',
          userId: user.id
        }));
      };

      websocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'notification') {
            // Invalidate queries to refresh notifications
            queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
            queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread-count'] });
            
            // Show browser notification if supported
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification(data.data.title, {
                body: data.data.message,
                icon: '/icon-192.png',
                badge: '/icon-192.png'
              });
            }
          }
        } catch (error) {
          console.error('WebSocket message parsing error:', error);
        }
      };

      websocket.onclose = () => {
        console.log('WebSocket disconnected');
      };

      websocket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

    } catch (error) {
      console.error('WebSocket connection error:', error);
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [user, queryClient]);

  return {
    notifications,
    unreadCount,
    isLoading: isLoading || countLoading,
    error,
    markAsRead: markAsReadMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
    isMarkingRead: markAsReadMutation.isPending,
    isMarkingAllRead: markAllAsReadMutation.isPending
  };
}

// Hook for push notifications (PWA)
export function usePushNotifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Subscribe to push notifications
  const subscribeMutation = useMutation({
    mutationFn: async () => {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        throw new Error('Push notifications not supported');
      }

      const registration = await navigator.serviceWorker.ready;
      
      // Check if already subscribed
      let subscription = await registration.pushManager.getSubscription();
      
      if (!subscription) {
        // Create new subscription
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: process.env.VITE_VAPID_PUBLIC_KEY // You'll need to set this
        });
      }

      // Send subscription to server
      const response = await fetch('/api/push-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription.toJSON()),
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to subscribe to push notifications');
      return response.json();
    }
  });

  // Unsubscribe from push notifications
  const unsubscribeMutation = useMutation({
    mutationFn: async () => {
      if (!('serviceWorker' in navigator)) {
        throw new Error('Service worker not supported');
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
      }

      const response = await fetch('/api/push-subscription', {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to unsubscribe from push notifications');
      return response.json();
    }
  });

  // Request notification permission
  const requestPermission = async () => {
    if (!('Notification' in window)) {
      throw new Error('Browser notifications not supported');
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  };

  return {
    subscribe: subscribeMutation.mutate,
    unsubscribe: unsubscribeMutation.mutate,
    requestPermission,
    isSubscribing: subscribeMutation.isPending,
    isUnsubscribing: unsubscribeMutation.isPending,
    subscribeError: subscribeMutation.error,
    unsubscribeError: unsubscribeMutation.error
  };
}