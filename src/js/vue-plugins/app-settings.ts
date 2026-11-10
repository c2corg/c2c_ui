import type { App } from 'vue';

import { type AppSettings, useAppSettingsStore } from '@/stores/app-settings';

export type { AppSettings };

declare module 'vue' {
  interface ComponentCustomProperties {
    $appSettings: AppSettings;
  }
}

// the app settings store, as $appSettings for the components (after Pinia). Installed early: it writes the theme
// and the layout on <html> before the first render
export default function install(app: App) {
  app.config.globalProperties.$appSettings = app.runWithContext(() => useAppSettingsStore());
}
