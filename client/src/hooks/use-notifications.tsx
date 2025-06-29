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

  const unreadCount = unreadData && typeof unreadData === 'object' && 'count' in unreadData ? (unreadData as any).count : 0;

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

  // Enhanced WebSocket connection for real-time updates
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
            
            // Don't show browser notifications - let push notifications handle background notifications
            // Only show if app is in foreground and push notifications aren't available
            if (document.visibilityState === 'visible' && 
                'Notification' in window && 
                Notification.permission === 'granted' &&
                !('serviceWorker' in navigator)) {
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

  // Listen for service worker messages
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const handleMessage = (event: MessageEvent) => {
      const { data } = event;
      
      switch (data.type) {
        case 'NAVIGATE':
          // Handle navigation from notification click
          window.history.pushState({}, '', data.url);
          window.dispatchEvent(new PopStateEvent('popstate'));
          break;
          
        case 'NOTIFICATION_READ':
          // Refresh notification data when marked as read from service worker
          queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
          queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread-count'] });
          break;
          
        default:
          console.log('Unknown message from service worker:', data);
      }
    };

    navigator.serviceWorker.addEventListener('message', handleMessage);

    return () => {
      navigator.serviceWorker.removeEventListener('message', handleMessage);
    };
  }, [queryClient]);

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

