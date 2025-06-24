import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Notification } from "@shared/schema";

export function useNotifications() {
  const queryClient = useQueryClient();
  
  // Fetch notifications
  const { data: notifications = [], isLoading, error } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Fetch unread count
  const { data: unreadCountData } = useQuery<{ count: number }>({
    queryKey: ["/api/notifications/unread-count"],
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  const unreadCount = unreadCountData?.count || 0;

  // Mark notification as read
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      return apiRequest(`/api/notifications/${notificationId}/read`, "PATCH");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
    },
  });

  // Mark all notifications as read
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("/api/notifications/mark-all-read", "PATCH");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
    },
  });

  const markAsRead = (notificationId: number) => {
    markAsReadMutation.mutate(notificationId);
  };

  const markAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    isMarkingAsRead: markAsReadMutation.isPending,
    isMarkingAllAsRead: markAllAsReadMutation.isPending,
  };
}

export function useNotificationPermission() {
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const newPermission = await Notification.requestPermission();
      setPermission(newPermission);
      return newPermission;
    }
    return permission;
  };

  const showNotification = (title: string, options?: NotificationOptions) => {
    if (permission === 'granted' && 'Notification' in window) {
      new Notification(title, {
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        ...options,
      });
    }
  };

  return {
    permission,
    requestPermission,
    showNotification,
    isSupported: 'Notification' in window,
  };
}