import { useState } from "react";
import { Bell, Check, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuHeader,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotifications } from "@/hooks/use-notifications";
import { formatDistance } from "date-fns";
import { cn } from "@/lib/utils";

export function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, isMarkingAllAsRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  const formatNotificationTime = (date: Date | string) => {
    const notificationDate = typeof date === 'string' ? new Date(date) : date;
    return formatDistance(notificationDate, new Date(), { addSuffix: true });
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'TASK_CREATED':
        return '📝';
      case 'TASK_ASSIGNED':
        return '👤';
      case 'TASK_STATUS_CHANGED':
        return '🔄';
      case 'TASK_COMMENT_ADDED':
        return '💬';
      case 'TASK_FILE_UPLOADED':
        return '📎';
      default:
        return '📋';
    }
  };

  const handleNotificationClick = (notification: any) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    setIsOpen(false);
    
    // Navigate to related task if available
    if (notification.relatedTaskId) {
      window.location.href = `/tasks?task=${notification.relatedTaskId}`;
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuHeader className="flex items-center justify-between p-3">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              disabled={isMarkingAllAsRead}
              className="h-auto p-1"
            >
              <CheckCheck className="h-4 w-4" />
            </Button>
          )}
        </DropdownMenuHeader>
        
        <DropdownMenuSeparator />
        
        <ScrollArea className="h-96">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              No notifications yet
            </div>
          ) : (
            notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={cn(
                  "flex flex-col items-start p-3 cursor-pointer",
                  !notification.isRead && "bg-blue-50 dark:bg-blue-950/20"
                )}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start w-full space-x-2">
                  <span className="text-lg flex-shrink-0 mt-0.5">
                    {getNotificationIcon(notification.type)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm truncate">
                        {notification.title}
                      </p>
                      {!notification.isRead && (
                        <div className="h-2 w-2 bg-blue-500 rounded-full flex-shrink-0 ml-2" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatNotificationTime(notification.createdAt!)}
                    </p>
                  </div>
                </div>
              </DropdownMenuItem>
            ))
          )}
        </ScrollArea>
        
        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="p-2">
              <Button variant="ghost" size="sm" className="w-full text-xs">
                View All Notifications
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}