<template>
    <router-link :to="{name:documentType + '-edit', params:{id:document.document_id, lang:lang}}">
        <slot>
            <span v-translate>Edit</span>
        </slot>
    </router-link>
</template>

<script>
    import { requireDocumentProperty } from "@/js/propertiesMixins"

    export default{
        mixins : [ requireDocumentProperty ],

        props: {
            lang:{
                type:String,
                required:true,
            },
        },
    }
</script>
