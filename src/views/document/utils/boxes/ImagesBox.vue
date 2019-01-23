<template>
    <div v-if="document.associations && document.associations.images" class="box no-print">
        <gallery :images="document.associations.images" ref="gallery"/>
    </div>
</template>

<script>
    import Gallery from '@/components/gallery/Gallery'

    import { requireDocumentProperty } from '@/js/properties-mixins'

    export default {
        components: { Gallery },
        mixins: [ requireDocumentProperty ]
    }
</script>
