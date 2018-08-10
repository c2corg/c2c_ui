<template>
    <div>
        <h2 v-if="markdown">{{title}}</h2>
        <markdown :content="markdown"/>
    </div>
</template>


<script>

    import Markdown from '@/components/Markdown'

    export default {

        components: {
            Markdown
        },

        props: ['markdown', 'title'],

    }
</script>