import type { App } from 'vue';

import { type User, useUserStore } from '@/stores/user';

const RENEW_CHECK_INTERVAL_MS = 3600 * 1000;

declare module 'vue' {
  interface ComponentCustomProperties {
    $user: User;
  }
}

// the user store, as $user for the components (after the language plugin and Pinia)
export default function install(app: App) {
  const user = app.runWithContext(() => useUserStore());
  app.config.globalProperties.$user = user;

  // a remembered session is renewed before it expires: at load, when the tab is shown again, and every hour
  void user.renewIfNeeded();
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      void user.renewIfNeeded();
    }
  });
  setInterval(() => void user.renewIfNeeded(), RENEW_CHECK_INTERVAL_MS);
}
