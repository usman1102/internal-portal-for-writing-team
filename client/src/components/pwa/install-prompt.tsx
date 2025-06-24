import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { X, Download, Smartphone, Chrome, MoreVertical } from 'lucide-react';
import { usePWA } from '@/hooks/use-pwa';

export function InstallPrompt() {
  const { showInstallPrompt, isInstalled, install, dismissInstallPrompt } = usePWA();
  const [showInstructions, setShowInstructions] = useState(false);

  if (isInstalled || !showInstallPrompt) {
    return null;
  }

  const isAndroidChrome = () => {
    const userAgent = navigator.userAgent;
    return /Android/i.test(userAgent) && /Chrome/i.test(userAgent) && !/Edge|OPR/i.test(userAgent);
  };

  const handleInstall = async () => {
    try {
      await install();
    } catch (error) {
      // If automatic install fails, show manual instructions
      setShowInstructions(true);
    }
  };

  return (
    <>
      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 z-50">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Install Paper Slay
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Get faster access and offline functionality
            </p>
            
            <div className="flex gap-2 mt-3">
              <Button
                size="sm"
                onClick={handleInstall}
                className="text-xs h-8"
              >
                <Download className="w-3 h-3 mr-1" />
                Install
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowInstructions(true)}
                className="text-xs h-8"
              >
                How?
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

      <Dialog open={showInstructions} onOpenChange={setShowInstructions}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Chrome className="h-5 w-5" />
              <span>Install on Android Chrome</span>
            </DialogTitle>
            <DialogDescription>
              Follow these steps to install Paper Slay as an app
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {isAndroidChrome() ? (
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-medium text-blue-600">
                    1
                  </div>
                  <div className="text-sm">
                    Tap the <strong>menu button</strong> <MoreVertical className="inline w-4 h-4" /> in Chrome
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-medium text-blue-600">
                    2
                  </div>
                  <div className="text-sm">
                    Look for <strong>"Add to Home screen"</strong> or <strong>"Install app"</strong>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-medium text-blue-600">
                    3
                  </div>
                  <div className="text-sm">
                    Tap <strong>"Add"</strong> or <strong>"Install"</strong> to confirm
                  </div>
                </div>
                
                <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                  <p className="text-sm text-green-800 dark:text-green-200">
                    <strong>Important:</strong> The app will have its own icon (not Chrome's) and open in full-screen mode, just like a native app.
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <p className="mb-2">To install Paper Slay as an app:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Open this site in Chrome on your Android device</li>
                  <li>Use Chrome's menu to select "Add to Home screen"</li>
                  <li>The app will install with its own branded icon</li>
                  <li>It will open in full-screen mode like a native app</li>
                </ul>
              </div>
            )}
            
            <Button
              onClick={() => setShowInstructions(false)}
              className="w-full"
            >
              Got it
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}