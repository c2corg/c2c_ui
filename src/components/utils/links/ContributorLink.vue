<template>
    <span>
        <author-link :author="contributor"/>
        (<router-link :to="{name: 'whatsnew', query: {u:contributor.user_id} }">c</router-link>)
    </span>
</template>

<script>
    import AuthorLink from '@/components/views/document/utils/AuthorLink'

    export default {
        components:{
            AuthorLink
        },

        props : ["contributor"]
    }
</script>
