<script>
    export default {
        props: {
            title: {
                type: String,
                required: true
            }
        },
        watch: {
            title: {
                handler() {
                    document.title = this.title + ' - Camptocamp.org'
                },
                immediate: true
            }
        },

        render() {
            return ''
        }
    }
</script>
