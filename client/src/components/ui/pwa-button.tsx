import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, Smartphone } from 'lucide-react';
import { isPWAInstalled } from '@/utils/pwa';

interface PWAButtonProps {
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "default" | "lg";
  className?: string;
}

export function PWAButton({ variant = "outline", size = "sm", className }: PWAButtonProps) {
  const [canInstall, setCanInstall] = React.useState(false);
  const [isInstalled, setIsInstalled] = React.useState(false);

  React.useEffect(() => {
    setIsInstalled(isPWAInstalled());

    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setCanInstall(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setCanInstall(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = () => {
    const installEvent = (window as any).deferredPrompt;
    if (installEvent) {
      installEvent.prompt();
      setCanInstall(false);
    }
  };

  if (isInstalled) {
    return (
      <Button variant={variant} size={size} className={className} disabled>
        <Smartphone className="w-4 h-4 mr-2" />
        Installed
      </Button>
    );
  }

  if (!canInstall) {
    return null;
  }

  return (
    <Button variant={variant} size={size} className={className} onClick={handleInstall}>
      <Download className="w-4 h-4 mr-2" />
      Install App
    </Button>
  );
}