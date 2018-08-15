<template>
    <router-link :to="{name:getType(type) + '-diff', params:{id:id, versionFrom:versionFrom || 'prev', versionTo:versionTo || 'next', lang:lang}}">
        <slot>diff</slot>
    </router-link>
</template>

<script>
    import constants from '@/js/constants.js'

    export default{
        props:["type", "versionFrom", "versionTo", "lang", "id"],
        methods:{
            getType:constants.getDocumentType
        }
    }
</script>
