export default function install(Vue) {
  Object.defineProperty(Vue.prototype, '$imageViewer', {
    get() {
      return this.$root.$children[0].$refs.imageViewer;
    },
  });
}
