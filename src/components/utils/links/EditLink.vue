<template>
    <router-link :to="{name:type + '-edit', params:{id:id, lang:lang}}">
        <slot>
            edit
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
