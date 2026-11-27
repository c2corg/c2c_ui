import type { App } from 'vue';

import { type Screen, useScreenStore } from '@/stores/screen';

export type { Screen };

declare module 'vue' {
  interface ComponentCustomProperties {
    $screen: Screen;
  }
}

// the screen store, as $screen for the components (after Pinia)
export default function install(app: App) {
  app.config.globalProperties.$screen = app.runWithContext(() => useScreenStore());
}
