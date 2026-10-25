import type { App, ComponentPublicInstance } from 'vue';

// The ImageViewer of App.vue registers itself here when created (no $root.$children, gone in Vue 3)
let imageViewer: ComponentPublicInstance | null = null;

export function registerImageViewer(vm: ComponentPublicInstance | null) {
  imageViewer = vm;
}

declare module 'vue' {
  interface ComponentCustomProperties {
    // the component's methods are not typed yet
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    $imageViewer: any;
  }
}

export default function install(app: App) {
  Object.defineProperty(app.config.globalProperties, '$imageViewer', {
    get() {
      return imageViewer;
    },
  });
}
