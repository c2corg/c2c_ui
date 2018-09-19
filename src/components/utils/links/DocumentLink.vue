<template>

    <router-link :to="{name:document.type, params:{id:document.document_id, lang:lang}}">
        <slot>
            <document-title v-if="document.type!='u'" :document="document"/>
            <span v-else>{{ document.name }}</span>
        </slot>
    </router-link>

</template>

<script>
    import { requireDocumentProperty } from '@/js/propertiesMixins.js'

    export default {

        mixins : [requireDocumentProperty],

        props: {
            lang:{
                type:String,
                required: false,
                default: undefined,
            }
        },
    }

</script>
