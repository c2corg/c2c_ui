<template>
    <router-link
        v-if="documentType!='profile'"
        :to="{name:documentType + '-version', params:{id:id, version:version, lang:lang}}">
        <slot/>
    </router-link>
    <span v-else>
        <slot/>
    </span>
</template>

<script>
    import { requireDocumentTypeProperty } from '@/js/properties-mixins'

    export default{
        mixins: [ requireDocumentTypeProperty ],

        props: {
            version: {
                type: Number,
                required: true
            },
            lang: {
                type: String,
                required: true
            },
            id: {
                type: Number,
                required: true
            }
        }
    }
</script>
