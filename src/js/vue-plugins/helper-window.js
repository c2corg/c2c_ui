// Vue 3 removed `$root.$children` — main.js calls setRootVm() with the mounted
// root instance so this getter can keep reaching App.vue's `ref="helper"`.
let rootVm = null;

export function setRootVm(vm) {
  rootVm = vm;
}

export default function install(app) {
  Object.defineProperty(app.config.globalProperties, '$helper', {
    get() {
      return rootVm.$refs.helper;
    },
  });
}
