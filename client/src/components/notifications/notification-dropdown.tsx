import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Bell, Check, CheckCheck } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface Notification {
  id: number;
  userId: number;
  type: string;
  title: string;
  message: string;
  relatedTaskId?: number;
  relatedUserId?: number;
  isRead: boolean;
  createdAt: string;
}

export function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);

  // Fetch unread notifications
  const { data: unreadNotifications = [] } = useQuery<Notification[]>({
    queryKey: ['/api/notifications/unread'],
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Fetch all notifications when dropdown is open
  const { data: allNotifications = [] } = useQuery<Notification[]>({
    queryKey: ['/api/notifications'],
    enabled: isOpen,
  });

  // Mark notification as read
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      await apiRequest('PUT', `/api/notifications/${notificationId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread'] });
    },
  });

  // Mark all as read
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('PUT', '/api/notifications/mark-all-read');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread'] });
    },
  });

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification.id);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'task_created':
        return '📝';
      case 'task_assigned':
        return '👤';
      case 'status_changed':
        return '🔄';
      case 'file_uploaded':
        return '📎';
      case 'team_member_added':
        return '👥';
      default:
        return '🔔';
    }
  };

  const displayNotifications = isOpen ? allNotifications : unreadNotifications;
  const unreadCount = unreadNotifications.length;

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
        <div className="flex items-center justify-between p-2">
          <DropdownMenuLabel>Notifications</DropdownMenuLabel>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={markAllAsReadMutation.isPending}
              className="text-xs"
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />
        
        {displayNotifications.length === 0 ? (
          <div className="p-4 text-center text-sm text-gray-500">
            No notifications
          </div>
        ) : (
          displayNotifications.map((notification) => (
            <DropdownMenuItem
              key={notification.id}
              className={`cursor-pointer p-3 ${!notification.isRead ? 'bg-blue-50' : ''}`}
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="flex items-start gap-3 w-full">
                <span className="text-lg">{getNotificationIcon(notification.type)}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">{notification.title}</p>
                    {!notification.isRead && (
                      <div className="h-2 w-2 bg-blue-500 rounded-full flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-gray-600 mt-1">{notification.message}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {formatDateTime(notification.createdAt)}
                  </p>
                </div>
              </div>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}