<template>
    <div v-if="area" class="section content">
        <h1>
            <i class="fas fa-globe-americas"></i>
            <document-title :document="area"/>
        </h1>

        <div class="columns">
            <div class="column is-6">
                <document-license :document="area" cc="by-sa"/>
            </div>
        </div>

        <div>
            <summary>
                <markdown :content="area.locales[0].summary"></markdown>
            </summary>

            <markdown :content="area.locales[0].description"></markdown>

        </div>
    </div>

</template>

<script>
    import Markdown from '@/components/Markdown'
    import DocumentTitle from '@/components/utils/DocumentTitle'
    import DocumentLicense from '@/components/utils/DocumentLicense'
    import Gallery from '@/components/utils/Gallery'

    import c2c from '@/js/c2c.js'

    export default {

        components: {
            Markdown,
            DocumentTitle,
            DocumentLicense,
            Gallery
        },

        data() {
            return {
                area: null,
            }
        },

        created() {
            c2c.area.get(this.$route.params.id).then(response => {this.area=response.data});
        }

    }
</script>
