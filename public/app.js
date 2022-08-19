/* eslint-disable no-console */
const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/serviceworker.js');
      if (registration.installing) {
        console.log('Service Worker installing');
      } else if (registration.waiting) {
        console.log('Service Worker installed');
      } else if (registration.active) {
        console.log('Service worker is active');
      }
    } catch (error) {
      console.error('Registration failed with ${error}');
    }
  }
};

registerServiceWorker();
