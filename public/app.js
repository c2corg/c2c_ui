/* eslint-disable no-console */

const registerServiceWorker = async () => {
  if ('serviceworker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/serviceworker.js');
      if (registration.installing) {
        console.log('Service Worker Installing');
      } else if (registration.waiting) {
        console.log('Service Worker installed');
      } else if (registration.active) {
        console.log('Service Worker is active');
      }
    } catch (error) {
      console.log('Registration failed with ${error}');
    }
  }
};

registerServiceWorker();
