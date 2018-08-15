<template>
    <div v-html="convert(content)"/>
</template>

<script>
    import markdown from '@/js/markdown.js'

    export default {
        props: ['content'],
        methods:{
            convert : markdown.convert
        }
    }
</script>
