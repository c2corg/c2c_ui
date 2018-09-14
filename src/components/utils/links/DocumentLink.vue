<template>

    <router-link :to="{name:document.type, params:{id:document.document_id, lang:lang}}">
        <slot>
            <document-title v-if="document.type!='u'" :document="document"/>
            <span v-else>{{ document.name }}</span>
        </slot>
    </router-link>

</template>

<script>
    import { prop } from '@/js/properties.js'

    export default {
        props: {
            document:prop.requiredObject,
            lang:prop.optionalString,
        },
    }

</script>
