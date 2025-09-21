import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Force cache clear and disable service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(function(registrations) {
    for(let registration of registrations) {
      registration.unregister().then(() => {
        window.location.reload(true);
      });
    }
  });
}

// Clear all caches
if ('caches' in window) {
  caches.keys().then(names => {
    names.forEach(name => {
      caches.delete(name);
    });
  });
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
