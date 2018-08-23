<template>
    <router-link :to="{name:type + '-add', params:{lang:lang}}">
        <slot>
            add
        </slot>
    </router-link>
</template>

<script>
    export default{
        props:["type", "lang"],
    }
</script>
