<template>
    <div>
        <!-- eslint-disable-next-line vue/no-v-html -->
        <div class="content" v-html="html"/>
        <div style="clear:both"/>
    </div>
</template>

<script>
    import markdown from '@/js/markdown.js'

    export default {
        props: {
            content:String,
        },

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
    padding:1rem;
    background: #FAFAFA;
    max-width:100%;
    display: table;
}

.markdown-image-right{
    float: right;
    clear: right;
    margin-right:0 !important;
}

.markdown-image-left{
    float: left;
    clear: left;
    margin-left:0 !important;
}

.markdown-image-center{
    //display: table;
    margin-left:auto !important;
    margin-right:auto !important;
}

.markdown-image img{
    max-width:100%;
}

</style>
