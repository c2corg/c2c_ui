<template>
    <div v-if="article" class="section content">
        <h1>
            <i class="far fa-file-alt"></i>
            <document-title :document="article"/>
        </h1>

        <div class="columns">
            <div class="column is-6">
                <activities :activities="article.activities"/>
            </div>
            <div class="column is-6">
                <document-license :document="article"
                                  :cc="article.article_type=='collab' ? 'by-sa' : 'by-nc-nd'"/>
            </div>
        </div>

        <div>
            <summary>
                <markdown :content="article.locales[0].summary"></markdown>
            </summary>

            <markdown :content="article.locales[0].description"></markdown>

        </div>
    </div>

</template>

<script>
    import Markdown from '@/components/Markdown'
    import DocumentTitle from '@/components/utils/DocumentTitle'
    import Activities from '@/components/utils/Activities'
    import DocumentLicense from '@/components/utils/DocumentLicense'
    import Gallery from '@/components/utils/Gallery'

    import c2c from '@/js/c2c.js'

    export default {

        components: {
            Markdown,
            DocumentTitle,
            Activities,
            DocumentLicense,
            Gallery
        },

        data() {
            return {
                article: null,
            }
        },

        created() {
            c2c.article.get(this.$route.params.id).then(response => {this.article=response.data});
        }

    }
</script>