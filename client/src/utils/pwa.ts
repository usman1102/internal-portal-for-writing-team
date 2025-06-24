// PWA utilities for installation and offline detection

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

class PWAManager {
  private deferredPrompt: BeforeInstallPromptEvent | null = null;
  private isOnline = navigator.onLine;
  private installButton: HTMLElement | null = null;

  constructor() {
    this.init();
  }

  private init() {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') return;
    
    // Listen for beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e as BeforeInstallPromptEvent;
      this.showInstallButton();
    });

    // Listen for app installation
    window.addEventListener('appinstalled', () => {
      console.log('PWA was installed');
      this.hideInstallButton();
      this.deferredPrompt = null;
    });

    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.onNetworkChange(true);
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.onNetworkChange(false);
    });

    // Register service worker
    this.registerServiceWorker();
  }

  private async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('SW registered: ', registration);

        // Update available
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                this.showUpdateAvailable();
              }
            });
          }
        });
      } catch (error) {
        console.log('SW registration failed: ', error);
      }
    }
  }

  private showInstallButton() {
    // Create install button if it doesn't exist
    if (!this.installButton) {
      this.installButton = document.createElement('button');
      this.installButton.innerHTML = '📱 Install App';
      this.installButton.className = 'fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg z-50';
      this.installButton.addEventListener('click', () => this.installApp());
      document.body.appendChild(this.installButton);
    }
    this.installButton.style.display = 'block';
  }

  private hideInstallButton() {
    if (this.installButton) {
      this.installButton.style.display = 'none';
    }
  }

  private async installApp() {
    if (!this.deferredPrompt) return;

    this.deferredPrompt.prompt();
    const { outcome } = await this.deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }
    
    this.deferredPrompt = null;
    this.hideInstallButton();
  }

  private showUpdateAvailable() {
    // Show a notification that an update is available
    const updateBar = document.createElement('div');
    updateBar.innerHTML = `
      <div class="fixed top-0 left-0 right-0 bg-blue-600 text-white p-3 text-center z-50">
        <span>New version available! </span>
        <button onclick="window.location.reload()" class="underline ml-2">Update now</button>
        <button onclick="this.parentElement.remove()" class="ml-4 text-lg">&times;</button>
      </div>
    `;
    document.body.appendChild(updateBar);
  }

  private onNetworkChange(isOnline: boolean) {
    // Show network status
    const existingStatus = document.getElementById('network-status');
    if (existingStatus) {
      existingStatus.remove();
    }

    if (!isOnline) {
      const offlineBar = document.createElement('div');
      offlineBar.id = 'network-status';
      offlineBar.innerHTML = `
        <div class="fixed top-0 left-0 right-0 bg-orange-500 text-white p-2 text-center z-40">
          📡 You're offline. Some features may be limited.
        </div>
      `;
      document.body.appendChild(offlineBar);
    }
  }

  // Public methods
  public isInstallable(): boolean {
    return this.deferredPrompt !== null;
  }

  public isAppInstalled(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches ||
           window.matchMedia('(display-mode: fullscreen)').matches ||
           (window.navigator as any).standalone === true;
  }

  public getNetworkStatus(): boolean {
    return this.isOnline;
  }

  public async requestNotificationPermission(): Promise<NotificationPermission> {
    if ('Notification' in window) {
      return await Notification.requestPermission();
    }
    return 'denied';
  }

  public showNotification(title: string, options?: NotificationOptions) {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        ...options
      });
    }
  }
}

// Export singleton instance
export const pwaManager = new PWAManager();

// Export utility functions
export const isPWAInstalled = () => pwaManager.isAppInstalled();
export const isOnline = () => pwaManager.getNetworkStatus();
export const requestNotifications = () => pwaManager.requestNotificationPermission();
export const showNotification = (title: string, options?: NotificationOptions) => 
  pwaManager.showNotification(title, options);