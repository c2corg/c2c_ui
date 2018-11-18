<template>
    <div v-if="document.associations && document.associations.images.length" class="box no-print">
        <gallery :images="document.associations.images"/>
    </div>
</template>

<script>
    import { requireDocumentProperty } from '@/js/properties-mixins'

    export default {
        mixins : [ requireDocumentProperty ],
    }
</script>
