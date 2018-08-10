<template>
    <span v-if="users.length">
        <i class="fas fa-users"/>
        <span v-for="user of users" :key="user.document_id">
            <document-link :document="user"/>
        </span>
    </span>
</template>

<script>
    import DocumentLink from '@/components/utils/DocumentLink'

    export default {

        components: {
            DocumentLink,
        },

        props : ["users"]
    }
</script>
