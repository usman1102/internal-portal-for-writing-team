import { useState, useEffect } from "react";
import { Bell, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNotificationPermission } from "@/hooks/use-notifications";

export function NotificationPermissionPrompt() {
  const { permission, requestPermission, isSupported } = useNotificationPermission();
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if user has already dismissed this prompt
    const dismissed = localStorage.getItem('notification-permission-dismissed');
    if (dismissed) {
      setIsDismissed(true);
    }
  }, []);

  const handleRequestPermission = async () => {
    const newPermission = await requestPermission();
    if (newPermission === 'granted' || newPermission === 'denied') {
      setIsDismissed(true);
      localStorage.setItem('notification-permission-dismissed', 'true');
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('notification-permission-dismissed', 'true');
    
    // Auto-show again in 7 days
    setTimeout(() => {
      localStorage.removeItem('notification-permission-dismissed');
    }, 7 * 24 * 60 * 60 * 1000);
  };

  // Don't show if not supported, already granted, or dismissed
  if (!isSupported || permission === 'granted' || permission === 'denied' || isDismissed) {
    return null;
  }

  return (
    <Card className="fixed bottom-4 right-4 w-80 z-50 shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bell className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-sm">Enable Notifications</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription className="text-xs">
          Get notified when tasks are assigned or updated
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex space-x-2">
          <Button
            onClick={handleRequestPermission}
            size="sm"
            className="flex-1"
          >
            Enable
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDismiss}
          >
            Later
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}