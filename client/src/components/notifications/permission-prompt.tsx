import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Bell, X, CheckCircle, AlertTriangle } from "lucide-react";

interface PermissionPromptProps {
  onPermissionGranted: () => void;
  onPermissionDenied: () => void;
  onDismiss: () => void;
}

export function PermissionPrompt({ onPermissionGranted, onPermissionDenied, onDismiss }: PermissionPromptProps) {
  const [permissionState, setPermissionState] = useState<NotificationPermission>('default');
  const [isRequesting, setIsRequesting] = useState(false);

  useEffect(() => {
    if ('Notification' in window) {
      setPermissionState(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      onPermissionDenied();
      return;
    }

    setIsRequesting(true);
    
    try {
      const permission = await Notification.requestPermission();
      setPermissionState(permission);
      
      if (permission === 'granted') {
        onPermissionGranted();
      } else {
        onPermissionDenied();
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      onPermissionDenied();
    } finally {
      setIsRequesting(false);
    }
  };

  if (permissionState === 'granted') {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-green-700">
            <CheckCircle className="h-5 w-5" />
            <span className="font-medium">Notifications enabled successfully!</span>
          </div>
          <p className="text-sm text-green-600 mt-2">
            You'll now receive background notifications for task updates, even when the app is closed.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (permissionState === 'denied') {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-red-700">
            <AlertTriangle className="h-5 w-5" />
            <span className="font-medium">Notifications blocked</span>
          </div>
          <p className="text-sm text-red-600 mt-2">
            To enable notifications, please allow them in your browser settings and refresh the page.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg text-blue-900">Enable Notifications</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            className="text-blue-600 hover:text-blue-800"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription className="text-blue-700">
          Stay updated with task assignments, comments, and deadlines
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm text-blue-800 font-medium">You'll receive notifications for:</p>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• New task assignments</li>
            <li>• Comments on your tasks</li>
            <li>• Status updates</li>
            <li>• Deadline reminders</li>
          </ul>
        </div>

        <Alert>
          <Bell className="h-4 w-4" />
          <AlertDescription className="text-xs">
            <strong>Background notifications:</strong> These will work even when the app is closed or your device is locked.
          </AlertDescription>
        </Alert>

        <div className="flex gap-2">
          <Button
            onClick={requestPermission}
            disabled={isRequesting}
            className="flex-1"
          >
            {isRequesting ? 'Requesting...' : 'Allow Notifications'}
          </Button>
          <Button
            variant="outline"
            onClick={onDismiss}
            className="text-gray-600"
          >
            Not Now
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}