<template>
    <router-link :to="{name:type + '-diff', params:{id:id, versionFrom:versionFrom || 'prev', versionTo:versionTo || 'next', lang:lang}}">
        <slot>
            diff
        </slot>
    </router-link>
</template>

<script>

    export default{
        props: {
            type:{
                type:String,
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
            versionFrom: {
                type:[Number, String],
                required:true,
            },
            versionTo: {
                type:[Number, String],
                required:true,
            },
        },
    }
</script>
