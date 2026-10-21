// The ImageViewer of App.vue registers itself here when created (no $root.$children, gone in Vue 3)
let imageViewer = null;

/** @param {import('vue').default | null} vm */
export function registerImageViewer(vm) {
  imageViewer = vm;
}

export default function install(app) {
  Object.defineProperty(app.config.globalProperties, '$imageViewer', {
    get() {
      return imageViewer;
    },
  });
}
