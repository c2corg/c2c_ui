<template>

    <div>
        <div class="columns">
            <div class="column is-3">
                <label>editor</label>
                <span>{{document.editor}}</span>
            </div>
            <div class="column is-3">
                <label>code</label>
                <span>{{document.code}}</span>
            </div>
            <div class="column is-3">
                <label>Scale</label>
                <span>{{document.scale}}</span>
            </div>
        </div>
        <summary>
            <markdown :content="locale.summary"></markdown>
        </summary>

        <markdown-section :document="document" :locale="locale" :field="fields.description"/>

        <document-comments :document="document" :locale="locale" />

        <div>
            <document-license :document="document" cc="by-sa"/>
        </div>

    </div>

</template>

<script>
    import Markdown from './utils/Markdown'
    import MarkdownSection from './utils/MarkdownSection'

    import DocumentComments from './utils/DocumentComments'

    export default {

        components: {
            Markdown,
            MarkdownSection,
            DocumentComments,
        },

        props:["document", "locale", "fields"],
    }
</script>
