import React, { useState, useEffect } from 'react';
import { X, Download, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if device is iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    // Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    if (isStandalone) return;

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Don't show immediately, wait a bit for user to explore
      setTimeout(() => {
        setShowPrompt(true);
      }, 10000); // Show after 10 seconds
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // For iOS, show prompt after delay if not installed
    if (isIOSDevice && !isStandalone) {
      setTimeout(() => {
        setShowPrompt(true);
      }, 15000); // Show after 15 seconds on iOS
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setShowPrompt(false);
      }
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Don't show again for this session
    sessionStorage.setItem('installPromptDismissed', 'true');
  };

  // Don't show if dismissed in this session
  if (sessionStorage.getItem('installPromptDismissed')) {
    return null;
  }

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-24 left-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50 max-w-sm mx-auto">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-red-600 rounded-lg flex items-center justify-center">
            <Smartphone className="text-white" size={20} />
          </div>
        </div>
        
        <div className="flex-1">
          <h3 className="font-semibold text-gray-800 mb-1">Install Jits Journal</h3>
          
          {isIOS ? (
            <div className="text-sm text-gray-600 mb-3">
              <p className="mb-2">Add to your home screen for quick access:</p>
              <ol className="list-decimal list-inside space-y-1 text-xs">
                <li>Tap the Share button <span className="inline-block">📤</span></li>
                <li>Select "Add to Home Screen"</li>
                <li>Tap "Add"</li>
              </ol>
            </div>
          ) : (
            <p className="text-sm text-gray-600 mb-3">
              Install the app for faster access and offline use.
            </p>
          )}
          
          <div className="flex gap-2">
            {deferredPrompt && !isIOS && (
              <button
                onClick={handleInstall}
                className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-1"
              >
                <Download size={14} />
                Install
              </button>
            )}
            
            <button
              onClick={handleDismiss}
              className="text-gray-500 px-3 py-1.5 rounded text-sm hover:bg-gray-100 transition-colors"
            >
              Not now
            </button>
          </div>
        </div>
        
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}