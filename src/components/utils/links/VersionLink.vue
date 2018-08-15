<template>
    <router-link :to="{name:getType(type) + '-version', params:{id:id, version:version, lang:lang}}">
        <slot/>
    </router-link>
</template>

<script>
    import constants from '@/js/constants.js'

    export default{
        props:["type", "version", "lang", "id"],
        methods:{
            getType:constants.getDocumentType
        }
    }
</script>
