import React, { useEffect, useState } from 'react';
import { Download, Smartphone, WifiOff, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsInstalled(isStandalone);

    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = async () => {
    if (!deferredPrompt) return false;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setDeferredPrompt(null);
      return true;
    }
    return false;
  };

  return {
    isInstallable: !!deferredPrompt,
    isInstalled,
    isIOS,
    install,
  };
}

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

export const PWAInstallButton: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        onClick={install}
        className={`flex items-center justify-center gap-2 rounded-xl bg-blue-600 font-medium text-white transition-colors hover:bg-blue-500 whitespace-nowrap shrink-0 ${
          compact ? 'min-h-[40px] px-3 py-1.5 text-xs' : 'min-h-[44px] px-4 py-2 text-xs'
        }`}
      >
        <Download className="h-4 w-4 shrink-0" />
        <span>Install App</span>
      </button>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowGuide(true)}
        className={`flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100/80 dark:bg-slate-800/80 font-medium text-slate-700 dark:text-slate-200 transition-colors hover:bg-slate-200 dark:hover:bg-slate-700 whitespace-nowrap shrink-0 ${
          compact ? 'min-h-[40px] px-3 py-1.5 text-xs' : 'min-h-[44px] px-3.5 py-2 text-xs'
        }`}
      >
        <Smartphone className="h-3.5 w-3.5 shrink-0" />
        <span>{isIOS ? 'Install on iOS' : 'Install APK / PWA'}</span>
      </button>

      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                Install Unlimited Virtual Browser
              </h3>
              <button
                onClick={() => setShowGuide(false)}
                className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-4 space-y-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              {isIOS ? (
                <>
                  <p>To install this browser on your iPhone or iPad home screen:</p>
                  <ol className="list-decimal pl-5 space-y-1.5">
                    <li>Tap the <strong>Share</strong> button in your Safari toolbar.</li>
                    <li>Scroll down and select <strong>Add to Home Screen</strong>.</li>
                    <li>Launch <strong>UV Browser</strong> in standalone full-screen mode.</li>
                  </ol>
                </>
              ) : (
                <>
                  <p>
                    You can install <strong>Unlimited Virtual Browser</strong> as a standalone mobile app on Android or Desktop:
                  </p>
                  <ol className="list-decimal pl-5 space-y-1.5">
                    <li>Open this app in Chrome or Edge on Android (outside the preview iframe if embedded).</li>
                    <li>Tap the browser menu and select <strong>Add to Home screen</strong> or <strong>Install app</strong>.</li>
                    <li>For native Android APK compilation with <code>androidx.webkit.ProfileStore</code>, open <strong>Menu → About & Android APK Blueprint</strong>.</li>
                  </ol>
                </>
              )}
            </div>
            <button
              onClick={() => setShowGuide(false)}
              className="mt-5 w-full min-h-[44px] rounded-xl bg-slate-900 dark:bg-blue-600 text-xs font-semibold text-white hover:opacity-95 transition-opacity"
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  if (isOnline) return null;

  return (
    <div className="fixed bottom-20 left-4 z-50 flex items-center gap-2 rounded-xl bg-amber-600 px-3.5 py-2 text-xs font-medium text-white shadow-lg">
      <WifiOff className="h-3.5 w-3.5 shrink-0" />
      <span>Offline Mode · Serving local profile cache</span>
    </div>
  );
};
