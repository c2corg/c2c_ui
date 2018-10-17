<template>
    <div class="control">
        <markdown-editor v-model="value_"/>
    </div>
</template>

<script>
    import MarkdownEditor from '@/components/markdownEditor/MarkdownEditor'

    export default {

        components: {
            MarkdownEditor,
        },

        props:{
            value: {
                type:String,
                default:null,
            },
        },

        computed:{
            value_:{
                get(){
                    return this.value
                },
                set(value){
                    this.$emit("input", value)
                }
            }
        },
    }

</script>
