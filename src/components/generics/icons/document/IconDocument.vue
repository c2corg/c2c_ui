<template>
    <component :is="'icon-' + documentType" />
</template>

<script>
    import { requireDocumentTypeProperty } from '@/js/propertiesMixins.js'

    export default {
        mixins : [ requireDocumentTypeProperty ],
    }
</script>
