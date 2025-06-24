import { useState, useEffect } from 'react';

interface PWAHookReturn {
  isInstallable: boolean;
  isInstalled: boolean;
  isOnline: boolean;
  install: () => Promise<void>;
  showInstallPrompt: boolean;
  dismissInstallPrompt: () => void;
}

export function usePWA(): PWAHookReturn {
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // Check if app is installed
    const checkInstalled = () => {
      return window.matchMedia('(display-mode: standalone)').matches ||
             window.matchMedia('(display-mode: fullscreen)').matches ||
             (window.navigator as any).standalone === true;
    };

    setIsInstalled(checkInstalled());

    // Handle beforeinstallprompt
    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
      
      // Show prompt after a delay if not dismissed
      if (!localStorage.getItem('pwa-prompt-dismissed')) {
        setTimeout(() => setShowInstallPrompt(true), 5000);
      }
    };

    // Handle app installation
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
    };

    // Handle online/offline
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    // Add event listeners
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const install = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstallable(false);
      setShowInstallPrompt(false);
    }
    
    setDeferredPrompt(null);
  };

  const dismissInstallPrompt = () => {
    setShowInstallPrompt(false);
    localStorage.setItem('pwa-prompt-dismissed', 'true');
    
    // Reset dismissal after 7 days
    setTimeout(() => {
      localStorage.removeItem('pwa-prompt-dismissed');
    }, 7 * 24 * 60 * 60 * 1000);
  };

  return {
    isInstallable,
    isInstalled,
    isOnline,
    install,
    showInstallPrompt,
    dismissInstallPrompt,
  };
}