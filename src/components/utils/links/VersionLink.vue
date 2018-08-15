<template>
    <router-link v-if="type!='u' && type!='profile'"
        :to="{name:getType(type) + '-version', params:{id:id, version:version, lang:lang}}">
        <slot/>
    </router-link>
    <span v-else>
        <slot/>
    </span>
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
