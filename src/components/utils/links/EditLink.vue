<template>
    <router-link :to="{name:type + '-edit', params:{id:id, lang:lang}}">
        <slot>
            <span v-translate>edit</span>
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
