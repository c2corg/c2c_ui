// What this browser offers for installing the app, kept reactive so the welcome tour, the home banner and the guide
// update by themselves:
//   - Chrome, Edge, Samsung Internet fire `beforeinstallprompt`, kept to open their install dialog from our button;
//   - Safari on iOS has no API: the user goes through the Share sheet;
//   - an installed app runs in `standalone` display mode, and then there is nothing left to offer.
import { reactive } from 'vue';

// not in the DOM typings: https://developer.mozilla.org/docs/Web/API/BeforeInstallPromptEvent
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export type DevicePlatform = 'ios' | 'android' | 'desktop';

function isStandalone() {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

const install = reactive({
  deferredPrompt: null as BeforeInstallPromptEvent | null,
  installed: isStandalone(),
});

window.addEventListener('beforeinstallprompt', (event) => {
  // kept for our button instead of the browser's own mini-bar
  event.preventDefault();
  install.deferredPrompt = event as BeforeInstallPromptEvent;
});

window.addEventListener('appinstalled', () => {
  install.installed = true;
  install.deferredPrompt = null;
});

export function devicePlatform(): DevicePlatform {
  const ua = navigator.userAgent;
  // iPadOS 13+ presents itself as a Mac: the touch screen gives it away
  if (/iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) {
    return 'ios';
  }
  return /Android/i.test(ua) ? 'android' : 'desktop';
}

// opens the browser's install dialog, resolves to true if accepted
export async function promptInstall(): Promise<boolean> {
  const event = install.deferredPrompt;
  if (!event) {
    return false;
  }
  // a captured prompt can be shown only once
  install.deferredPrompt = null;
  await event.prompt();
  const { outcome } = await event.userChoice;
  return outcome === 'accepted';
}

export default install;
