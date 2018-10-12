<template>
    <div>
        <div class="field is-horizontal">
            <div class="field has-addons">
                <editor-button icon="bold" />
                <editor-button icon="italic" />
                <editor-button icon="heading" />
            </div>

            <div class="field has-addons">
                <editor-button icon="link" />
                <editor-button icon="image" />
                <editor-button icon="grin" />
            </div>

            <div class="field has-addons">
                <editor-button icon="hashtag" />
                <editor-button icon="list-ul" />
                <editor-button icon="list-ol" />
                <editor-button icon="code" />
                <editor-button icon="comment" />
            </div>

            <div class="field has-addons">
                <editor-button icon="question-circle" />
            </div>

        </div>
        <textarea v-model="value_" class="textarea"/>
    </div>
</template>

<script>
    import EditorButton from "./EditorButton"

    export default {

        components: {
            EditorButton,
        },

        props:{
            value:{
                type:String,
                default:"",
            }
        },

        computed:{
            value_:{
                get(){
                    return this.value
                },
                set(value){
                    this.value = value
                    this.$emit("input", value)
                }
            }
        }
    }
</script>

<style scoped>
    .has-addons{
        margin-right:1rem;
    }
</style>
