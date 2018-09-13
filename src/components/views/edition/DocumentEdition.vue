<template>
    <div v-if="document && locale" class="section">
        <h1 class="title">
            Edit
            <document-title :document="document"/>
            in
            {{ locale.lang }}
        </h1>
        <save-block :document="document"/>
        <component :is="type + '-edition-content'"
                   :document="document" :locale="locale"
                   :fields="constants.objectDefinitions[type].fields"/>
    </div>
</template>

<script>
    import c2c from '@/js/c2c.js'
    import user from '@/js/user.js'
    import constants from '@/js/constants.js'

    import AreaEditionContent from './content/AreaEditionContent'
    import ArticleEditionContent from './content/ArticleEditionContent'
    import BookEditionContent from './content/BookEditionContent'
    import ImageEditionContent from './content/ImageEditionContent'
    import MapEditionContent from './content/MapEditionContent'
    import OutingEditionContent from './content/OutingEditionContent'
    import ProfileEditionContent from './content/ProfileEditionContent'
    import RouteEditionContent from './content/RouteEditionContent'
    import WaypointEditionContent from './content/WaypointEditionContent'
    import XreportEditionContent from './content/XreportEditionContent'

    import SaveBlock from './content/utils/SaveBlock'

    export default{
        components:{

            SaveBlock,

            AreaEditionContent,
            ArticleEditionContent,
            BookEditionContent,
            ImageEditionContent,
            MapEditionContent,
            OutingEditionContent,
            ProfileEditionContent,
            RouteEditionContent,
            WaypointEditionContent,
            XreportEditionContent,
        },

        data() {
            return {
                documentId: this.$route.params.id,
                mode: null,
                type: null,
                document: null,
                locale: null,
                constants,
            }
        },

        created(){

            if(this.$route.name.endsWith("-edit")){
                this.type = this.$route.name.replace("-edit","");
                this.mode = "edit"

                c2c[this.type].get(this.$route.params.id).then(response => {
                    this.document=response.data
                    this.locale = user.getLocaleStupid(this.document, this.$route.params.lang)
                });
            } else {
                this.type = this.$route.name.replace("-add","");
                this.mode = "add"
                this.document = constants.buildDocument(this.type,
                    this.$route.params.lang || user.data.lang)

                this.locale = this.document.locales[0]

            }

        },
    }
</script>
