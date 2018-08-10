<template>

    <span>
        <i class="fas fa-map-marker-alt"></i>
        <document-title  v-for="area in document.areas"
                         v-if="area.area_type=='range'"
                         :key="area.document_id"
                         :document="area"/>
    </span>

</template>

<script>

    import DocumentTitle from '@/components/utils/DocumentTitle'

    export default {
        components: {
            DocumentTitle,
        },

        props: ['document'],
}

</script>