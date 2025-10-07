import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// One-time service worker and cache cleanup
const SW_CLEANUP_KEY = 'sw_cleanup_done_v2';
if (!sessionStorage.getItem(SW_CLEANUP_KEY)) {
  console.log('Cleaning up service workers and caches...');
  
  // Unregister service workers
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      registrations.forEach(reg => reg.unregister());
    });
  }
  
  // Clear all caches
  if ('caches' in window) {
    caches.keys().then(names => {
      names.forEach(name => caches.delete(name));
    });
  }
  
  // Mark cleanup as done
  sessionStorage.setItem(SW_CLEANUP_KEY, 'true');
  
  // Reload once to get fresh code
  window.location.reload();
}

// Show update notification
function showUpdateNotification() {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('Jits Journal Updated', {
      body: 'New version available. Refresh to get the latest features!',
      icon: '/icon-192x192.png'
    });
  }
}

// Request notification permission
if ('Notification' in window && Notification.permission === 'default') {
  Notification.requestPermission().then((permission) => {
    console.log('Notification permission:', permission);
  });
}

console.log('BJJ Journal - Full App Restored!');
console.log('Open in new window if you see caching issues');

createRoot(document.getElementById("root")!).render(<App />);
