import { useEffect, useState } from 'react';
import { Wifi, WifiOff, Download, Check } from 'lucide-react';

export function ServiceWorkerStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isInstalled, setIsInstalled] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [showStatus, setShowStatus] = useState(false);

  useEffect(() => {
    // Check if service worker is installed
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(() => {
        setIsInstalled(true);
      });

      // Listen for updates
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        setUpdateAvailable(true);
      });
    }

    // Network status listeners
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Auto-hide status after 3 seconds
    const timer = setTimeout(() => setShowStatus(false), 3000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearTimeout(timer);
    };
  }, []);

  const handleUpdate = () => {
    window.location.reload();
  };

  if (!showStatus && isOnline && !updateAvailable) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {/* Network Status */}
      {!isOnline && (
        <div className="flex items-center gap-2 bg-orange-500 text-white px-3 py-2 rounded-lg shadow-lg">
          <WifiOff size={16} />
          <span className="text-sm">Offline Mode</span>
        </div>
      )}

      {/* Service Worker Status */}
      {isInstalled && (
        <div className="flex items-center gap-2 bg-green-500 text-white px-3 py-2 rounded-lg shadow-lg">
          <Check size={16} />
          <span className="text-sm">App Cached</span>
        </div>
      )}

      {/* Update Available */}
      {updateAvailable && (
        <div className="flex items-center gap-2 bg-blue-500 text-white px-3 py-2 rounded-lg shadow-lg">
          <Download size={16} />
          <button
            onClick={handleUpdate}
            className="text-sm underline hover:no-underline"
          >
            Update Available - Tap to Refresh
          </button>
        </div>
      )}
    </div>
  );
}

export function useServiceWorker() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check service worker status
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(() => {
        setIsInstalled(true);
      });
    }

    // Network listeners
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const storeOfflineData = async (data: any) => {
    if (!isOnline) {
      try {
        const request = indexedDB.open('jits-journal-offline', 1);
        
        request.onupgradeneeded = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains('pendingClasses')) {
            db.createObjectStore('pendingClasses', { keyPath: 'id' });
          }
        };

        request.onsuccess = () => {
          const db = request.result;
          const transaction = db.transaction(['pendingClasses'], 'readwrite');
          const store = transaction.objectStore('pendingClasses');
          store.add({ ...data, id: Date.now() });
        };
      } catch (error) {
        console.error('Failed to store offline data:', error);
      }
    }
  };

  return {
    isOnline,
    isInstalled,
    storeOfflineData
  };
}