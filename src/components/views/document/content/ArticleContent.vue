<template>
    <div>
        <div class="columns">
            <div class="column is-6">
                <activities :activities="document.activities"/>
            </div>
            <div class="column is-6">
                <document-license :document="document"
                                  :cc="document.article_type=='collab' ? 'by-sa' : 'by-nc-nd'"/>
            </div>
        </div>

        <div>
            <summary>
                <markdown :content="locale.summary"></markdown>
            </summary>

            <markdown :content="locale.description"></markdown>

        </div>
    </div>

</template>

<script>
    import Markdown from '@/components/Markdown'
    import Activities from '@/components/utils/Activities'
    import DocumentLicense from '@/components/utils/DocumentLicense'
    import Gallery from '@/components/utils/Gallery'

    export default {

        components: {
            Markdown,
            Activities,
            DocumentLicense,
            Gallery
        },

        props:["document", "locale"]
    }
</script>
