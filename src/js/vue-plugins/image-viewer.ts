import { ref, type App } from 'vue';

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

// ImageViewer (and Swiper) is only loaded when a page shows an image (#4877). Until then, the images the pages push are
// kept here, and given to the viewer when it registers, with the image to show
let pendingImages: ViewerImage[] = [];
let pendingShow: ViewerImage | null = null;

// true once a page has shown an image: App.vue then renders (and loads) ImageViewer
export const imageViewerRequested = ref(false);

export function registerImageViewer(viewer: ImageViewer | null) {
  imageViewer = viewer;
  if (viewer) {
    pendingImages.forEach((image) => viewer.push(image));
    pendingImages = [];
    if (pendingShow) {
      viewer.show(pendingShow);
      pendingShow = null;
    }
  }
}

// what $imageViewer gives the pages: the viewer once loaded, the pending images before
const viewerOrPending: ImageViewer = {
  push(image) {
    if (imageViewer) {
      imageViewer.push(image);
    } else {
      pendingImages.push(image);
    }
  },
  show(image) {
    if (imageViewer) {
      imageViewer.show(image);
    } else {
      pendingShow = image;
      imageViewerRequested.value = true;
    }
  },
  clear() {
    if (imageViewer) {
      imageViewer.clear();
    } else {
      pendingImages = [];
      pendingShow = null;
    }
  },
};

declare module 'vue' {
  interface ComponentCustomProperties {
    $imageViewer: ImageViewer;
  }
}

export default function install(app: App) {
  Object.defineProperty(app.config.globalProperties, '$imageViewer', {
    get() {
      return viewerOrPending;
    },
  });
}
