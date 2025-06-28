import { Bell, Check, CheckCheck } from "lucide-react";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotifications } from "@/hooks/use-notifications";
import { formatDateTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

export function NotificationBell() {
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    isMarkingRead,
    isMarkingAllRead
  } = useNotifications();

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'TASK_CREATED':
        return '📝';
      case 'TASK_ASSIGNED':
        return '👤';
      case 'TASK_STATUS_CHANGED':
        return '🔄';
      case 'COMMENT_ADDED':
        return '💬';
      case 'FILE_UPLOADED':
        return '📎';
      case 'DEADLINE_REMINDER':
        return '⏰';
      default:
        return '🔔';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'TASK_CREATED':
        return 'text-blue-600';
      case 'TASK_ASSIGNED':
        return 'text-green-600';
      case 'TASK_STATUS_CHANGED':
        return 'text-orange-600';
      case 'COMMENT_ADDED':
        return 'text-purple-600';
      case 'FILE_UPLOADED':
        return 'text-indigo-600';
      case 'DEADLINE_REMINDER':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          Notifications
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAllAsRead()}
              disabled={isMarkingAllRead}
              className="h-6 px-2 text-xs"
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              Mark all read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {isLoading ? (
          <div className="p-4 text-center text-sm text-gray-500">
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-4 text-center text-sm text-gray-500">
            No notifications yet
          </div>
        ) : (
          <ScrollArea className="h-96">
            {notifications.map((notification: any) => (
              <DropdownMenuItem
                key={notification.id}
                className={cn(
                  "flex items-start gap-3 p-3 cursor-pointer",
                  !notification.isRead && "bg-blue-50"
                )}
                onClick={() => {
                  if (!notification.isRead) {
                    markAsRead(notification.id);
                  }
                  // Navigate to task if relatedTaskId exists
                  if (notification.relatedTaskId) {
                    window.location.href = `/tasks?taskId=${notification.relatedTaskId}`;
                  }
                }}
              >
                <div className="flex-shrink-0 text-lg">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className={cn(
                      "text-sm font-medium",
                      notification.isRead ? "text-gray-600" : "text-gray-900"
                    )}>
                      {notification.title}
                    </p>
                    {!notification.isRead && (
                      <div className="h-2 w-2 bg-blue-600 rounded-full flex-shrink-0" />
                    )}
                  </div>
                  <p className={cn(
                    "text-xs leading-relaxed",
                    notification.isRead ? "text-gray-500" : "text-gray-700"
                  )}>
                    {notification.message}
                  </p>
                  <p className="text-xs text-gray-400">
                    {formatDateTime(notification.createdAt)}
                  </p>
                </div>
              </DropdownMenuItem>
            ))}
          </ScrollArea>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}