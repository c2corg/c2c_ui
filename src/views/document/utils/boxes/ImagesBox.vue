<template>
    <div v-if="document.associations.images && document.associations.images.length !== 0" class="box no-print">
        <gallery :images="document.associations.images" ref="gallery"/>
    </div>
</template>

<script>
    import { requireDocumentProperty } from '@/js/properties-mixins'

    export default {
        mixins: [ requireDocumentProperty ]
    }
</script>
