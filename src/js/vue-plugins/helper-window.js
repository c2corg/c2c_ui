// The HelperWindow of App.vue registers itself here when created (no $root.$children, gone in Vue 3)
let helperWindow = null;

/** @param {import('vue').default | null} vm */
export function registerHelperWindow(vm) {
  helperWindow = vm;
}

export default function install(app) {
  Object.defineProperty(app.config.globalProperties, '$helper', {
    get() {
      return helperWindow;
    },
  });
}
