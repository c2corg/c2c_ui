<template>

    <router-link :to="{name:document.type, params:{id:document.document_id, lang:lang}}">
        <slot>
            <document-title v-if="document.type!='u'" :document="document"/>
            <span v-else>{{ document.name }}</span>
        </slot>
    </router-link>

</template>

<script>

    export default {
        props: ['document', 'lang'],
    }

</script>
