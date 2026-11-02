import type { App } from 'vue';

import { type User, useUserStore } from '@/stores/user';

declare module 'vue' {
  interface ComponentCustomProperties {
    $user: User;
  }
}

// the user store, as $user for the components (after the language plugin and Pinia)
export default function install(app: App) {
  app.config.globalProperties.$user = app.runWithContext(() => useUserStore());
}
