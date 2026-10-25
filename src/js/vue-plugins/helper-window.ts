import type { App, ComponentPublicInstance } from 'vue';

// The HelperWindow of App.vue registers itself here when created (no $root.$children, gone in Vue 3)
let helperWindow: ComponentPublicInstance | null = null;

export function registerHelperWindow(vm: ComponentPublicInstance | null) {
  helperWindow = vm;
}

declare module 'vue' {
  interface ComponentCustomProperties {
    // the component's methods are not typed yet
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    $helper: any;
  }
}

export default function install(app: App) {
  Object.defineProperty(app.config.globalProperties, '$helper', {
    get() {
      return helperWindow;
    },
  });
}
