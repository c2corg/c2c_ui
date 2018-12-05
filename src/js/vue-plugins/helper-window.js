
export default function install(Vue) {
    Object.defineProperty(Vue.prototype, '$helper', {
        get() {
            return this.$root.$children[0].$refs.helper
        }
    })
}
