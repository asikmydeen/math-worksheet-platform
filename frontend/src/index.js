import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register service worker for PWA functionality
serviceWorkerRegistration.register({
  onUpdate: (registration) => {
    // Show update available notification
    console.log('New version available!');
  },
  onSuccess: (registration) => {
    // Show offline ready notification
    console.log('App ready for offline use!');
  }
});

// Request notification permission after user interaction
setTimeout(() => {
  serviceWorkerRegistration.requestNotificationPermission();
}, 5000);
