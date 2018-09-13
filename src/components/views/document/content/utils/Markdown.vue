<template>
    <div class="content" v-html="html"/>
</template>

<script>
    import markdown from '@/js/markdown.js'

    export default {
        props: ['content'],
        computed:{
            html(){
                return markdown.convert(this.content)
            }
        }
    }
</script>

<style lang="scss">

.markdown-ltag td:first-child{
    font-weight:bold;
}

.markdown-image{
    border-radius: 4px;
    border:1px solid #DDD;
    padding:0.5rem;
    background: #FAFAFA;
}

.markdown-image-right{
    float: right;
    margin-right:0 !important;
}
</style>
