import type { App } from 'vue';

// What HelperWindow offers to the pages: $helper.show('<article id>#<anchor>')
export type Helper = { show(helperId: string): void };

// The HelperWindow of App.vue registers itself here when created (no $root.$children, gone in Vue 3)
let helperWindow: Helper | null = null;

export function registerHelperWindow(helper: Helper | null) {
  helperWindow = helper;
}

declare module 'vue' {
  interface ComponentCustomProperties {
    $helper: Helper | null;
  }
}

export default function install(app: App) {
  Object.defineProperty(app.config.globalProperties, '$helper', {
    get() {
      return helperWindow;
    },
  });
}
