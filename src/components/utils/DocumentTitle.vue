<template>
    <span>{{ title }}</span>
</template>

<script>
    import utils from '@/js/utils.js'
    import { requireDocumentProperty } from '@/js/propertiesMixins.js'

    export default {
        mixins: [ requireDocumentProperty ],

        computed:{
            title(){
                return utils.getDocumentTitle(this.document, this.$route.params.lang)
            }
        }
    }
</script>
