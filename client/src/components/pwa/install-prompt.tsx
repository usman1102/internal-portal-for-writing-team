import React from 'react';
import { Button } from '@/components/ui/button';
import { X, Download, Smartphone } from 'lucide-react';
import { usePWA } from '@/hooks/use-pwa';

export function InstallPrompt() {
  const { showInstallPrompt, isInstalled, install, dismissInstallPrompt } = usePWA();

  if (isInstalled || !showInstallPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Smartphone className="w-5 h-5 text-blue-600" />
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-gray-900">
            Install Task Manager
          </h3>
          <p className="text-xs text-gray-600 mt-1">
            Install our app for quick access and offline functionality
          </p>
          
          <div className="flex gap-2 mt-3">
            <Button
              size="sm"
              onClick={install}
              className="text-xs h-8"
            >
              <Download className="w-3 h-3 mr-1" />
              Install
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={dismissInstallPrompt}
              className="text-xs h-8"
            >
              Later
            </Button>
          </div>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={dismissInstallPrompt}
          className="p-1 h-auto"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}