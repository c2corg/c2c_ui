<template>
    <div class="markdown-editor" :class="{'is-active':focus, 'fullScreen':fullScreen}">
        <div class="button-bar">
            <div class="buttons has-addons is-pulled-right">
                <editor-button icon="question-circle" :tooltip="$gettext('Help')"/>

                <span>&nbsp;</span>

                <editor-button
                    :icon="fullScreen ? 'compress' : 'expand'"
                    :tooltip="$gettext('Toggle fullscreen')"
                    @click="fullScreen=!fullScreen"/>
            </div>

            <div class="buttons has-addons">

                <editor-button icon="bold" @click="handleBold" :tooltip="$gettext('strong text')"/>
                <editor-button icon="italic" @click="handleItalic" :tooltip="$gettext('emphasized text')"/>
                <editor-button icon="heading" @click="handleHeading" :tooltip="$gettext('Heading')"/>

                <span>&nbsp;</span>
                
                <!--
                <editor-button icon="link" @click="handleLink" :tooltip="$gettext('URL/Link')"/>
                <editor-button icon="image" @click="handleImage" :tooltip="$gettext('Insert image')"/>
                <editor-button icon="grin" @click="handleEmoji" :tooltip="$gettext('Insert emoji')"/>

                <span>&nbsp;</span>
                -->

                <editor-button icon="hashtag" @click="handleHashtag" :tooltip="$gettext('Pitch description tag')"/>
                <editor-button icon="list-ul" @click="handleListUl" :tooltip="$gettext('Unordered list')"/>
                <editor-button icon="list-ol" @click="handleListOl" :tooltip="$gettext('Ordered list')"/>
                <editor-button icon="code" @click="handleCode" :tooltip="$gettext('Unformatted text')"/>
                <editor-button icon="comment" @click="handleQuote" :tooltip="$gettext('Quote')"/>

                <span>&nbsp;</span>

                <editor-button
                    :icon="preview ? 'code' : 'eye'"
                    :text="preview ? $gettext('Back to code') : $gettext('Preview')"
                    @click="preview=!preview"/>


            </div>
        </div>

        <div class=" markdown-editor-content">
            <textarea
                ref="textarea"
                class="textarea"
                @input="onInput"
                @focus="focus=true"
                @blur="focus=false"/>

            <markdown class="preview" v-if="preview" :content="value" />
        </div>

    </div>
</template>

<script>
    import EditorButton from "./EditorButton"

    function Selection(textarea, onInput){
        this.textarea = textarea
        this.onInput = onInput
    }

    Object.defineProperty(Selection.prototype, 'start', {
        get(){
            return this.textarea.selectionStart
        },
        set(value){
            this.textarea.selectionStart = value
        }
    })

    Object.defineProperty(Selection.prototype, 'end', {
        get(){
            return this.textarea.selectionEnd
        },
        set(value){
            this.textarea.selectionEnd = value
        }
    })

    Object.defineProperty(Selection.prototype, 'length', {
        get(){
            return this.end - this.start
        }
    })

    Object.defineProperty(Selection.prototype, 'text', {
        get(){
            return this.textarea.value.substr(this.start, this.length)
        }
    })


    Object.defineProperty(Selection.prototype, 'isEmpty', {
        get(){
            return this.start==this.end
        }
    })

    Selection.prototype.set = function(start, end){
        this.start = start
        this.end = end ? end : start
    }

    Selection.prototype.setText = function(text, before, after){
        before = before ? before : ""
        after = after ? after : ""

        let chunk = before + text + after

        var start = this.start
        this.textarea.value = this.textarea.value.substr(0, this.start) + chunk + this.textarea.value.substr(this.end, this.textarea.value.length)
        this.set(start + before.length, start + before.length + text.length)

        this.onInput(this.textarea.value)
    }

    Selection.prototype.replace = function(pattern, replacement) {
        this.setText(this.text.replace(pattern, replacement))
    }

    Selection.prototype.isSurroundedBy = function(before, after){
        const beforeLength = before.length
        const afterLength = after.length
        const content = this.textarea.value

        return content.substr(this.start - beforeLength, beforeLength) === before && content.substr(this.end, afterLength) === after
    }

    Selection.prototype.expandToEntireLine = function(){
        var start = this.textarea.value.lastIndexOf("\n", this.start)
        this.start = start + 1
        var end = this.textarea.value.indexOf('\n', this.end)
        this.end = end == -1 ? this.textarea.value.length : end
    }

    Selection.prototype.linesStartsWith = function (tag) {
        for(let line of this.text.split("\n")){
            if(!line.startsWith(tag))
                return false
        }

        return true
    }

    Selection.prototype.removeLinePrefix = function (tag) {
        this.setText(this.text.split("\n").map(line => line.substr(tag.length)).join("\n"))
    }


    Selection.prototype.addLinePrefix = function (tag) {
        this.setText(this.text.split("\n").map(line => tag + line).join("\n"))
    }

    export default {

        components: {
            EditorButton,
        },

        props:{
            value:{
                type:String,
                default:"",
            },
        },

        data(){
            return {
                selection: null,
                focus: false,
                preview: false,
                fullScreen: false,
            }
        },

        mounted(){
            this.$refs.textarea.value = this.value
            this.selection = new Selection(this.$refs.textarea, this.onInput)
        },

        methods:{
            onInput(){
                this.$emit("input", this.$refs.textarea.value)
            },

            handleSimpleMarkdownTag(tag, defaultChunk){

                const tagLength = tag.length

                if (this.selection.isSurroundedBy(tag, tag)) {
                    // remove tag
                    let chunk = this.selection.text
                    this.selection.set(this.selection.start - tagLength, this.selection.end + tagLength)
                    this.selection.setText(chunk)
                } else {
                    // add tag
                    let chunk = this.selection.isEmpty ? defaultChunk : this.selection.text
                    this.selection.setText(chunk, tag, tag)
                }

                // give back focus to textarea
                // event may have given focus to a button
                this.$refs.textarea.focus()
            },

            handleBlockMarkdownTag(tag, defaultChunk){

                this.selection.expandToEntireLine()

                if(this.selection.isEmpty){
                    this.selection.setText(defaultChunk)
                    this.selection.set(this.selection.start + tag.length)
                } else if(this.selection.linesStartsWith(tag)){
                    this.selection.removeLinePrefix(tag)
                    this.selection.set(this.selection.start)
                } else {
                    this.selection.addLinePrefix(tag)
                    this.selection.set(this.selection.start + tag.length)
                }

                this.$refs.textarea.focus()
            },

            handleBold(){
                this.handleSimpleMarkdownTag("**", this.$gettext("strong text"))
            },

            handleItalic(){
                this.handleSimpleMarkdownTag("_", this.$gettext("emphasized text"))
            },

            handleHeading(){
                const defaultChunk = this.$gettext("heading text")

                this.selection.expandToEntireLine()

                if(this.selection.text.startsWith("#")){
                    this.selection.replace(/^#+ */, "")
                } else {
                    let chunk = this.selection.isEmpty ? defaultChunk : this.selection.text
                    this.selection.setText(chunk, "## ")
                }

                this.$refs.textarea.focus()
            },

            handleLink(){
                // TODO
            },

            handleImage(){
                // TODO
            },

            handleEmoji(){
                // TODO
            },

            handleHashtag(){
                this.selection.expandToEntireLine()

                if(this.selection.isEmpty){
                    this.selection.setText("L# | cotation | length | description\nL# | cotation | length | description\nL# | cotation | length | description")
                    this.selection.set(this.selection.start + 5)
                } else {
                    this.selection.addLinePrefix("L# | ")
                }

                this.$refs.textarea.focus()
            },

            handleListUl(){
                this.handleBlockMarkdownTag("* ", "* item 1\n* item 2\n* item 3")
            },

            handleListOl(){
                this.handleBlockMarkdownTag("1. ", "1. item 1\n2. item 2\n3. item 3")
            },

            handleCode(){
                if(this.selection.text.includes("\n")){
                    this.handleBlockMarkdownTag("    ")
                } else { // inline code mode
                    this.handleSimpleMarkdownTag("`", this.$gettext("Code fragment"))
                }
            },

            handleQuote(){
                this.handleBlockMarkdownTag("> ", "> Citation")
            },
        }
    }
</script>

<style scoped lang="scss">
    .markdown-editor{
        border:1px solid lightgrey;
        box-shadow: none;
        transition: 300ms;
        border-radius: 3px;
        background: white;

        .button-bar{
            padding:0.5rem;
            background: #EEE;
            margin-bottom: 0;
            padding-bottom:0;
        }

        .button-bar{
            border-bottom: 1px dashed lightgrey;
        }

        .buttons{
            margin:0
        }

        .markdown-editor-content{
            position: relative;
        }

        textarea, textarea:focus{
            font-family: monospace;
            padding:0;
            border:0;
            box-shadow: none;
            min-height:200px;
            padding:0.5rem;
        }

        .preview{
            padding:0.5rem;
            position:absolute;
            top:0;
            left:0;
            height:100%;
            width: 100%;
            background: #ffffe0;
            overflow-y: auto;
        }
    }

    .is-active{
        border: 1px solid #66afe9;
        box-shadow: inset 0 1px 1px rgba(0,0,0,.075), 0 0 8px rgba(102,175,233,.6);
        transition: 300ms;
    }

    .fullScreen{
        position:fixed;
        top:0;
        left:0;
        z-index:999;
        width:100%;
        height:100%;

        .markdown-editor-content, textarea{
            height:100%;
            resize: None;
            max-height:None;
        }
    }

</style>
