<template>

    <div class="columns">

        <div  class="column is-9">
            <summary>
                <markdown :content="locale.summary"></markdown>
            </summary>
            <markdown :content="locale.description"></markdown>

        </div>

        <div class="column is-3">
            <information-item>
                <activities :activities="document.activities"/>
            </information-item>

            <simple-information-item label="author" :content="document.author"/>

            <information-item label="book type" v-if="document.book_types.length">
                {{document.book_types.join(', ')}}
            </information-item>

            <simple-information-item label="editor" :content="document.editor"/>
            <simple-information-item label="ISBN" :content="document.isbn"/>
            <simple-information-item label="number of pages" :content="document.nb_pages"/>
            <simple-information-item label="publication date" :content="document.publication_date"/>
            <document-license :document="document" cc="by-sa"/>

        </div>
    </div>

</template>

<script>
    import Markdown from '@/components/Markdown'
    import DocumentLicense from '@/components/utils/DocumentLicense'
    import Gallery from '@/components/utils/Gallery'
    import Activities from '@/components/utils/Activities'
    import InformationItem from '@/components/views/document/utils/InformationItem'
    import SimpleInformationItem from '@/components/views/document/utils/SimpleInformationItem'

    export default {

        components: {
            Markdown,
            DocumentLicense,
            Activities,
            InformationItem,
            SimpleInformationItem,
            Gallery
        },

        props:["document", "locale"]

    }
</script>
