<template>
    <span>{{ title }}</span>
</template>

<script>
    import utils from '@/js/utils.js'

    export default {
        props: {
            document: Object
        },

        computed:{
            title(){
                return utils.getDocumentTitle(this.document, this.$route.params.lang)
            }
        }
    }
</script>
