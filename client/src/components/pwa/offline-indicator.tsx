import React from 'react';
import { WifiOff } from 'lucide-react';
import { usePWA } from '@/hooks/use-pwa';

export function OfflineIndicator() {
  const { isOnline } = usePWA();

  if (isOnline) {
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