<template>
    <div v-if="document.associations && document.associations.images" class="box no-print">
        <gallery :images="document.associations.images" ref="gallery"/>
    </div>
</template>

<script>
    import { requireDocumentProperty } from '@/js/properties-mixins'

    export default {
        mixins: [ requireDocumentProperty ]
    }
</script>
