import type { App } from 'vue';

import { type Gdpr, type GdprChoice, useGdprStore } from '@/stores/gdpr';

export type { Gdpr, GdprChoice };

declare module 'vue' {
  interface ComponentCustomProperties {
    $gdpr: Gdpr;
  }
}

// the GDPR store, as $gdpr for the components (after Pinia); analytics follows the statistics choice
export default function install(app: App) {
  const gdpr = app.runWithContext(() => useGdprStore());

  // after a choice (setAll calls set inside the store, unseen by $onAction: both are followed)
  gdpr.$onAction(({ name, after }) => {
    if (name === 'set' || name === 'setAll') {
      // $ga is installed after $gdpr
      after(() =>
        gdpr.gdprValue?.statistics
          ? app.config.globalProperties.$ga.enable()
          : app.config.globalProperties.$ga.disable()
      );
    }
  });

  app.config.globalProperties.$gdpr = gdpr;
}
