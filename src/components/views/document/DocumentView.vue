
<template>
    <div class="section content">

        <h1>
            <icon-document :type="type"/>
            <document-title :document="document" v-if="document"/>
        </h1>

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
                type:this.$route.name,
                document: null,
                locale: null,
            }
        },

        created() {
            c2c[this.type].get(this.$route.params.id).then(response => {
                this.document=response.data
                this.locale = user.getLocaleSmart(this.document, this.$route.params.lang)
            });
        }
    }

</script>
