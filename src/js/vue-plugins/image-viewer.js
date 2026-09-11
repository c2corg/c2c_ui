// Vue 3 removed `$root.$children` — main.js calls setRootVm() with the mounted
// root instance so this getter can keep reaching App.vue's `ref="imageViewer"`.
let rootVm = null;

export function setRootVm(vm) {
  rootVm = vm;
}

export default function install(app) {
  Object.defineProperty(app.config.globalProperties, '$imageViewer', {
    get() {
      return rootVm.$refs.imageViewer;
    },
  });
}
