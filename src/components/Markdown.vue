<template>
<div v-html="convert(content)">
</div>
</template>

<script>
    import markdown from '@/js/markdown.js'

    export default {
        props: ['content'],
        data(){
            return {
            convert : markdown.convert
            }
        }
    }
</script>