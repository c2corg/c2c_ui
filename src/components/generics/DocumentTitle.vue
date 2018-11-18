<template>
    <span>{{ title }}</span>
</template>

<script>
    import { requireDocumentProperty } from '@/js/properties-mixins'

    export default {
        mixins: [ requireDocumentProperty ],

        computed:{
            title(){
                return this.$documentUtils.getDocumentTitle(this.document, this.$route.params.lang)
            }
        }
    }
</script>
