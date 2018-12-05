<template>
    <component :is="'icon-' + documentType" />
</template>

<script>
    import { requireDocumentTypeProperty } from '@/js/properties-mixins'

    export default {
        mixins: [ requireDocumentTypeProperty ]
    }
</script>
