<template>
    <div v-if="book" class="section content">
        <h1>
            <i class="fas fa-atlas"></i>
            <document-title :document="book"/>
        </h1>

        <div class="columns">

            <div  class="column is-9">
                <summary>
                    <markdown :content="book.locales[0].summary"></markdown>
                </summary>
                <markdown :content="book.locales[0].description"></markdown>

            </div>

            <div class="column is-3">
                <information-item>
                    <activities :activities="book.activities"/>
                </information-item>

                <simple-information-item label="author" :content="book.author"/>

                <information-item label="book type" v-if="book.book_types.length">
                    {{book.book_types.join(', ')}}
                </information-item>

                <simple-information-item label="editor" :content="book.editor"/>
                <simple-information-item label="ISBN" :content="book.isbn"/>
                <simple-information-item label="number of pages" :content="book.nb_pages"/>
                <simple-information-item label="publication date" :content="book.publication_date"/>
                <document-license :document="book" cc="by-sa"/>

            </div>
        </div>

    </div>

</template>

<script>
    import Markdown from '@/components/Markdown'
    import DocumentTitle from '@/components/utils/DocumentTitle'
    import DocumentLicense from '@/components/utils/DocumentLicense'
    import Gallery from '@/components/utils/Gallery'
    import Activities from '@/components/utils/Activities'
    import InformationItem from '@/components/views/document/utils/InformationItem'
    import SimpleInformationItem from '@/components/views/document/utils/SimpleInformationItem'

    import c2c from '@/js/c2c.js'

    export default {

        components: {
            Markdown,
            DocumentTitle,
            DocumentLicense,
            Activities,
            InformationItem,
            SimpleInformationItem,
            Gallery
        },

        data() {
            return {
                book: null,
            }
        },

        created() {
            c2c.book.get(this.$route.params.id).then(response => {this.book=response.data});
        }

    }
</script>
