import type { App } from 'vue';

import type { Image } from '@/js/image-urls';

// an image of the viewer: its title, and the languages it can be edited in
export type ViewerImage = Image & { locales: { title?: string | null }[]; available_langs?: string[] | null };

// What ImageViewer offers to the pages: the images of the page, and the one to show
export type ImageViewer = {
  push(image: ViewerImage): void;
  show(image: ViewerImage): void;
  clear(): void;
};

// The ImageViewer of App.vue registers itself here when created (no $root.$children, gone in Vue 3)
let imageViewer: ImageViewer | null = null;

export function registerImageViewer(viewer: ImageViewer | null) {
  imageViewer = viewer;
}

declare module 'vue' {
  interface ComponentCustomProperties {
    $imageViewer: ImageViewer;
  }
}

export default function install(app: App) {
  Object.defineProperty(app.config.globalProperties, '$imageViewer', {
    get() {
      return imageViewer;
    },
  });
}
