<template>
    <span v-if="users.length">
        <icon-users />
        <span v-for="user of users" :key="user.document_id">
            <document-link :document="user"/>
        </span>
    </span>
</template>

<script>
    export default {
        props : ["users"]
    }
</script>
