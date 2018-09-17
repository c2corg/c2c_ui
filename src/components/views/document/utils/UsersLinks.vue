<template>
    <span v-if="users.length">
        <document-link v-for="user of users" :key="user.document_id" :document="user" class="user-link-label"/>
    </span>
</template>

<script>
    export default {
        props : {
            users:Array,
        }
    }
</script>

<style scoped>

.user-link-label:not(:last-child)::after{
    content:", ";
}

</style>
