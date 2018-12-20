<template>
    <div v-if="document.associations && document.associations.images.length" class="box no-print">
        <gallery :images="document.associations.images" ref="gallery"/>
    </div>
</template>

<script>
    import { requireDocumentProperty } from '@/js/properties-mixins'

    export default {
        mixins: [ requireDocumentProperty ],

        methods: {
            showFullscreen(imageId) {
                this.$refs.gallery.showFullscreen(imageId)
            }
        }
    }
</script>
