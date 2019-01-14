<template>
    <span :title="$gettext(documentType)">
        <icon-document :document-type="documentType"/>
    </span>
</template>

<script>
    import { requireDocumentTypeProperty } from '@/js/properties-mixins'

    export default {
        mixins: [ requireDocumentTypeProperty ]
    }
</script>
