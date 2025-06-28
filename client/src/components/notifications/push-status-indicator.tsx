import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, XCircle, Clock } from "lucide-react";

interface PushStatus {
  isRegistered: boolean;
  hasPermission: boolean;
  isSupported: boolean;
  lastTest?: Date;
}

export function PushStatusIndicator() {
  const [status, setStatus] = useState<PushStatus>({
    isRegistered: false,
    hasPermission: false,
    isSupported: false
  });

  useEffect(() => {
    checkPushStatus();
  }, []);

  const checkPushStatus = async () => {
    const isSupported = 'serviceWorker' in navigator && 
                       'PushManager' in window && 
                       'Notification' in window;
    
    const hasPermission = Notification.permission === 'granted';
    
    let isRegistered = false;
    if (isSupported) {
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        isRegistered = subscription !== null;
      } catch (error) {
        console.error('Error checking push registration:', error);
      }
    }

    setStatus({
      isSupported,
      hasPermission,
      isRegistered
    });
  };

  const getStatusBadge = () => {
    if (!status.isSupported) {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <XCircle className="h-3 w-3" />
          Not Supported
        </Badge>
      );
    }

    if (!status.hasPermission) {
      return (
        <Badge variant="secondary" className="flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          Permission Needed
        </Badge>
      );
    }

    if (!status.isRegistered) {
      return (
        <Badge variant="outline" className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Not Registered
        </Badge>
      );
    }

    return (
      <Badge variant="default" className="flex items-center gap-1 bg-green-500">
        <CheckCircle className="h-3 w-3" />
        Active
      </Badge>
    );
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-600">Push Status:</span>
      {getStatusBadge()}
    </div>
  );
}