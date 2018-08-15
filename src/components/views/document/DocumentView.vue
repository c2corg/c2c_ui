
<template>
    <div class="section content">

        <h1>
            <icon-document :type="type"/>
            <document-title :document="document" v-if="document"/>
        </h1>

        <p v-if="isVersionView">
            (diff)
            ← Version précédente
            |
            Voir la version actuelle
            (diff)
            |
            Version suivante →
            (diff)
        </p>

        <component :is="type + '-content'" v-if="document"
            :document="document" :locale="locale"/>
    </div>
</template>

<script>
    import c2c from '@/js/c2c.js'
    import user from '@/js/user.js'

    import RouteContent from './content/RouteContent'
    import OutingContent from './content/OutingContent'
    import ProfileContent from './content/ProfileContent'
    import ArticleContent from './content/ArticleContent'
    import BookContent from './content/BookContent'
    import AreaContent from './content/AreaContent'
    import ImageContent from './content/ImageContent'
    import WaypointContent from './content/WaypointContent'
    import XreportContent from './content/XreportContent'

    export default {
        components:{
            RouteContent,
            OutingContent,
            ProfileContent,
            ArticleContent,
            BookContent,
            AreaContent,
            ImageContent,
            WaypointContent,
            XreportContent,
        },

        data() {
            return {
                isVersionView:this.$route.name.endsWith("-version"),
                type:this.$route.name.split("-")[0],
                document: null,
                locale: null,
                version: null,
                previousVersionId: null,
                nextVersionId: null,
            }
        },

        created() {
            if(this.isVersionView){
                c2c[this.type].getVersion(this.$route.params.id,this.$route.params.lang,this.$route.params.version).then(response => {
                    this.document = response.data.document
                    this.locale = user.getLocaleStupid(this.document, this.$route.params.lang)
                    this.version = response.data.version
                    this.nextVersionId = response.data.next_version_id
                    this.previousVersionId = response.data.previous_version_id
                    console.log(response)
                })
            } else {

                c2c[this.type].get(this.$route.params.id).then(response => {
                    this.document=response.data
                    this.locale = user.getLocaleSmart(this.document, this.$route.params.lang)
                });
            }
        }
    }

</script>
