<template>

    <router-link :to="{name:documentType, params:{id:document.document_id, lang:lang}}">
        <slot>
            <document-title v-if="document.type!='u'" :document="document"/>
            <span v-else>{{ document.name }}</span>
        </slot>
    </router-link>

</template>

<script>
    import { requireDocumentProperty } from '@/js/properties-mixins'

    export default {

        mixins: [requireDocumentProperty],

        props: {
            lang: {
                type: String,
                default: null
            }
        }
    }

</script>
