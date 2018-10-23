<template>
    <router-link :to="{name:documentType + '-edit', params:{id:id, lang:lang}}">
        <slot>
            <span v-translate>edit</span>
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
