<template>
    <router-link :to="{name:'profile', params:{id:author.user_id}}">
        {{ author.name }}
    </router-link>
</template>

<script>
    export default {
        props : {
            author: Object,
        },
    }
</script>
