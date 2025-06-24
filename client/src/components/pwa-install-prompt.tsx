import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Download, X, Smartphone, Chrome } from "lucide-react";
import { usePWA } from "@/hooks/use-pwa";

export function PWAInstallPrompt() {
  const { isInstallable, isInstalled, install, showInstallPrompt, dismissInstallPrompt } = usePWA();
  const [showManualInstructions, setShowManualInstructions] = useState(false);

  if (isInstalled || !showInstallPrompt) {
    return null;
  }

  const handleInstall = async () => {
    try {
      await install();
    } catch (error) {
      // If automatic install fails, show manual instructions
      setShowManualInstructions(true);
    }
  };

  const isAndroidChrome = () => {
    const userAgent = navigator.userAgent;
    return /Android/i.test(userAgent) && /Chrome/i.test(userAgent) && !/Edge|OPR/i.test(userAgent);
  };

  return (
    <>
      {/* Install prompt banner */}
      <Card className="fixed bottom-4 left-4 right-4 z-50 shadow-lg md:left-auto md:right-4 md:w-96">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Smartphone className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-sm">Install App</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={dismissInstallPrompt}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription className="text-xs">
            Install TaskManager for faster access and offline use
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex space-x-2">
            <Button
              onClick={handleInstall}
              size="sm"
              className="flex-1"
            >
              <Download className="h-4 w-4 mr-1" />
              Install
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowManualInstructions(true)}
            >
              How?
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Manual installation instructions dialog */}
      <Dialog open={showManualInstructions} onOpenChange={setShowManualInstructions}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Chrome className="h-5 w-5" />
              <span>Install on Android Chrome</span>
            </DialogTitle>
            <DialogDescription>
              Follow these steps to install TaskManager as an app
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {isAndroidChrome() ? (
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-medium text-blue-600">
                    1
                  </div>
                  <div className="text-sm">
                    Tap the <strong>three dots menu</strong> (⋮) in Chrome
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-medium text-blue-600">
                    2
                  </div>
                  <div className="text-sm">
                    Select <strong>"Add to Home screen"</strong> or <strong>"Install app"</strong>
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
                
                <div className="bg-green-50 p-3 rounded-lg">
                  <p className="text-sm text-green-800">
                    <strong>Note:</strong> The app will appear with its own icon (not Chrome's icon) and open in full-screen mode.
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-600">
                <p className="mb-2">To install this app:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Open this site in Chrome on Android</li>
                  <li>Use Chrome's menu to "Add to Home screen"</li>
                  <li>The app will install with its own icon</li>
                </ul>
              </div>
            )}
            
            <div className="pt-2">
              <Button
                onClick={() => setShowManualInstructions(false)}
                className="w-full"
              >
                Got it
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}