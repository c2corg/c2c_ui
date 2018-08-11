<template>

    <span>
        <icon-area/>
        <document-title  v-for="area in document.areas"
                         v-if="area.area_type=='range'"
                         :key="area.document_id"
                         :document="area"/>
    </span>

</template>

<script>

    export default {
        props: ['document'],
    }

</script>
