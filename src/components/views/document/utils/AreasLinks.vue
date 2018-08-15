<template>
    <span v-if="areas && areas.length">
        <i class="fas fa-globe-americas"></i>
        <i v-for="area of areas" :key="area.document_id">
            <document-link :document="area"/>
        </i>
    </span>
</template>

<script>
    export default {
        props : ["areas"]
    }
</script>
