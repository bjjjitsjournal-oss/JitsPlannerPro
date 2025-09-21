// Service Worker utilities for BJJ Journal

export const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered:', registration.scope);
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      throw error;
    }
  }
  throw new Error('Service Worker not supported');
};

export const unregisterServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.ready;
    await registration.unregister();
    console.log('Service Worker unregistered');
  }
};

export const updateServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.ready;
    await registration.update();
    console.log('Service Worker updated');
  }
};

export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if ('Notification' in window) {
    const permission = await Notification.requestPermission();
    console.log('Notification permission:', permission);
    return permission;
  }
  return 'denied';
};

export const showNotification = (title: string, options?: NotificationOptions) => {
  if ('Notification' in window && Notification.permission === 'granted') {
    return new Notification(title, {
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      ...options
    });
  }
  return null;
};

export const scheduleTrainingReminder = (message: string, delay: number = 24 * 60 * 60 * 1000) => {
  setTimeout(() => {
    showNotification('BJJ Training Reminder', {
      body: message,
      actions: [
        { action: 'log-class', title: 'Log Class' },
        { action: 'dismiss', title: 'Dismiss' }
      ]
    });
  }, delay);
};

// Store data offline when network is unavailable
export const storeOfflineData = async (storeName: string, data: any) => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('jits-journal-offline', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const addRequest = store.add(data);
      
      addRequest.onsuccess = () => resolve(addRequest.result);
      addRequest.onerror = () => reject(addRequest.error);
    };
    
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName, { keyPath: 'id' });
      }
    };
  });
};

// Check if app is running in standalone mode (PWA)
export const isStandalone = (): boolean => {
  return window.matchMedia('(display-mode: standalone)').matches ||
         (window.navigator as any).standalone === true;
};

// Check if app is online
export const isOnline = (): boolean => {
  return navigator.onLine;
};

// Listen for online/offline events
export const addNetworkListeners = (
  onOnline: () => void,
  onOffline: () => void
) => {
  window.addEventListener('online', onOnline);
  window.addEventListener('offline', onOffline);
  
  return () => {
    window.removeEventListener('online', onOnline);
    window.removeEventListener('offline', onOffline);
  };
};

// Background sync registration
export const registerBackgroundSync = async (tag: string) => {
  if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
    const registration = await navigator.serviceWorker.ready;
    await registration.sync.register(tag);
    console.log('Background sync registered:', tag);
  }
};

// Clear all caches
export const clearAllCaches = async () => {
  if ('caches' in window) {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)));
    console.log('All caches cleared');
  }
};