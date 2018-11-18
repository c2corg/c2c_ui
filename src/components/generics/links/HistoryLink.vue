<template>
    <router-link :to="{name:documentType + '-history', params:{id:document.document_id, lang:lang}}">
        <slot>
            hist
        </slot>
    </router-link>
</template>

<script>
    import { requireDocumentProperty } from '@/js/properties-mixins'

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
