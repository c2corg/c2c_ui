<template>

    <div>
        <summary>
            <markdown :content="locale.summary"></markdown>
        </summary>

        <markdown-section :document="document" :locale="locale" :field="objectDefinition.localeFields.description"/>

        <div >
            <document-license :document="document" cc="by-sa"/>
        </div>

    </div>

</template>

<script>
    import Markdown from './utils/Markdown'
    import MarkdownSection from './utils/MarkdownSection'
    import DocumentLicense from '@/components/utils/DocumentLicense'
    import Gallery from '@/components/utils/Gallery'

    export default {

        components: {
            Markdown,
            MarkdownSection,
            DocumentLicense,
            Gallery
        },

        props:["document", "locale", "objectDefinition"]
    }
</script>
