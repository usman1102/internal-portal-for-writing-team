import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { isOnline } from '@/utils/pwa';

export function OfflineIndicator() {
  const [online, setOnline] = useState(isOnline());
  const [showOfflineMessage, setShowOfflineMessage] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setOnline(true);
      setShowOfflineMessage(false);
    };

    const handleOffline = () => {
      setOnline(false);
      setShowOfflineMessage(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (online) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 bg-orange-500 text-white p-2 text-center z-50 text-sm">
      <div className="flex items-center justify-center gap-2">
        <WifiOff className="w-4 h-4" />
        <span>You're offline. Some features may be limited.</span>
      </div>
    </div>
  );
}