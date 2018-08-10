<template>
    <span v-if="areas.length">
        <i class="fas fa-globe-americas"></i>
        <i v-for="area of areas" :key="area.document_id">
            <document-link :document="area"/>
        </i>
    </span>
</template>

<script>
    import DocumentLink from '@/components/utils/DocumentLink'

    export default {

        components: {
            DocumentLink,
        },

        props : ["areas"]

    }
</script>
