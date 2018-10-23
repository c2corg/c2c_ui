<template>
    <router-link :to="{name:documentType + '-history', params:{id:id, lang:lang}}">
        <slot>
            hist
        </slot>
    </router-link>
</template>

<script>
    import { requireDocumentTypeProperty } from "@/js/propertiesMixins"

    export default{
        mixins : [ requireDocumentTypeProperty ],

        props: {
            lang:{
                type:String,
                required:true,
            },
            id: {
                type:Number,
                required:true,
            },
        },
    }
</script>
