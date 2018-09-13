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
            type:String,
            lang:String,
            id: Number,
        },
    }
</script>
