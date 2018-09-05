<template>

    <div>
        <summary>
            <markdown :content="locale.summary"></markdown>
        </summary>

        <markdown-section :document="document" :locale="locale" :field="fields.description"/>

        <div >
            <document-license :document="document" cc="by-sa"/>
        </div>

    </div>

</template>

<script>
    import Markdown from './utils/Markdown'
    import MarkdownSection from './utils/MarkdownSection'

    export default {

        components: {
            Markdown,
            MarkdownSection,
        },

        props:["document", "locale", "fields"],
    }
</script>
