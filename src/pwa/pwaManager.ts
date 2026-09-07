// src/pwa/pwaManager.ts - PWA Registration & Native Install Prompt Manager

export interface PwaInstallState {
  canInstall: boolean;
  isInstalled: boolean;
}

type PwaListener = (state: PwaInstallState) => void;

class PwaManager {
  private deferredPrompt: any = null;
  private listeners: Set<PwaListener> = new Set();
  private isInstalled = false;

  constructor() {
    if (typeof window !== 'undefined') {
      // Check if already running as installed PWA
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true;
      this.isInstalled = isStandalone;

      // Listen for browser install prompt
      window.addEventListener('beforeinstallprompt', (e) => {
        // Prevent Chrome 67 and earlier from automatically showing the prompt
        e.preventDefault();
        this.deferredPrompt = e;
        this.notify();
      });

      // Listen for successful installation
      window.addEventListener('appinstalled', () => {
        this.deferredPrompt = null;
        this.isInstalled = true;
        this.notify();
      });

      // Register Service Worker
      this.registerServiceWorker();
    }
  }

  public registerServiceWorker(): void {
    if ('serviceWorker' in navigator && process.env.NODE_ENV !== 'test') {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            // Check for updates
            registration.onupdatefound = () => {
              const installingWorker = registration.installing;
              if (installingWorker) {
                installingWorker.onstatechange = () => {
                  if (installingWorker.state === 'installed') {
                    if (navigator.serviceWorker.controller) {
                      console.log('PDFirst updated: new content available offline.');
                    } else {
                      console.log('PDFirst is cached for offline use.');
                    }
                  }
                };
              }
            };
          })
          .catch((err) => {
            console.warn('Service worker registration failed:', err);
          });
      });
    }
  }

  public subscribe(listener: PwaListener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => this.listeners.delete(listener);
  }

  public getState(): PwaInstallState {
    return {
      canInstall: !!this.deferredPrompt && !this.isInstalled,
      isInstalled: this.isInstalled
    };
  }

  public async triggerInstallPrompt(): Promise<boolean> {
    if (!this.deferredPrompt) {
      return false;
    }

    // Show native prompt
    this.deferredPrompt.prompt();

    const { outcome } = await this.deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      this.deferredPrompt = null;
      this.isInstalled = true;
      this.notify();
      return true;
    }

    return false;
  }

  private notify() {
    const state = this.getState();
    for (const listener of this.listeners) {
      listener(state);
    }
  }
}

export const pwaManager = new PwaManager();
