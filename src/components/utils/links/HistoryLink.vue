<template>
    <router-link :to="{name:getType(type) + '-history', params:{id:id, lang:lang}}">
        <slot>
            hist
        </slot>
    </router-link>
</template>

<script>
    import constants from '@/js/constants.js'

    export default{
        props:["type", "lang", "id"],
        methods:{
            getType:constants.getDocumentType
        }
    }
</script>
