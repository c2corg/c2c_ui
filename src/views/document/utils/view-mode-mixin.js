export default {
    computed: {
        isVersionView() {
            return this.$route.name.endsWith('-version')
        },

        isDraftView() { // means preview for edit and add mode
            return this.$route.name.endsWith('-edit') || this.$route.name.endsWith('-add')
        },

        isNormalView() {
            return !this.isDraftView && !this.isVersionView
        }
    }
}
