<template>
    <router-link v-if="type!='u' && type!='profile'"
                 :to="{name:type + '-version', params:{id:id, version:version, lang:lang}}">
        <slot/>
    </router-link>
    <span v-else>
        <slot/>
    </span>
</template>

<script>

    export default{
        props: {
            type:{
                type:String,
                required:true,
            },
            version:{
                type:Number,
                required:true,
            },
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
