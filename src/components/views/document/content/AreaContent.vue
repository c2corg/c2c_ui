<template>

    <div>
        <summary>
            <markdown :content="locale.summary"></markdown>
        </summary>

        <markdown :content="locale.description"></markdown>

        <div >
            <document-license :document="document" cc="by-sa"/>
        </div>

    </div>

</template>

<script>
    import Markdown from '@/components/views/document/utils/Markdown'
    import DocumentLicense from '@/components/utils/DocumentLicense'
    import Gallery from '@/components/utils/Gallery'

    export default {

        components: {
            Markdown,
            DocumentLicense,
            Gallery
        },

        props:["document", "locale"]
    }
</script>
