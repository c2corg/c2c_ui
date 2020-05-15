export default function install(Vue) {
  Object.defineProperty(Vue.prototype, '$alert', {
    get() {
      return this.$root.$children[0].$refs.alertWindow;
    },
  });
}
