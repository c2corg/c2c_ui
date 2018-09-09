<template>

    <div class="columns">
        <div class="column is-3">
            <map-view :document="document" style="width: 100%; height: 300px">
            </map-view>

            <document-license :document="document" cc="by-sa"/>

        </div>

        <div class="column">
            <summary>
                <markdown :content="locale.summary"></markdown>
            </summary>

            <markdown-section :document="document" :locale="locale" :field="fields.description"/>

            <document-comments :document="document" :locale="locale" />
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
