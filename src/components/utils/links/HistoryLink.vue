<template>
    <router-link :to="{name:type + '-history', params:{id:id, lang:lang}}">
        <slot>
            hist
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
        },
    }
</script>
