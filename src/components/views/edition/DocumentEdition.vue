<template>
    <div class="section">
        <p>
            <input type="text"/>
            <button class="button is-primary">
                Save
            </button>
        </p>
        <component :is="type + '-edition-content'" :document="document" :locale="locale"></component>
    </div>
</template>

<script>
    import c2c from '@/js/c2c.js'
    import user from '@/js/user.js'

    import RouteEditionContent from './content/RouteEditionContent'
    /*
    import OutingEditionContent from './content/OutingEditionContent'
    import ProfileEditionContent from './content/ProfileEditionContent'
    import ArticleEditionContent from './content/ArticleEditionContent'
    import BookEditionContent from './content/BookEditionContent'
    import AreaEditionContent from './content/AreaEditionContent'
    import ImageEditionContent from './content/ImageEditionContent'
    import WaypointEditionContent from './content/WaypointEditionContent'
    import XreportEditionContent from './content/XreportEditionContent'
    */
    export default{
        components:{
            RouteEditionContent,
        },

        data() {
            return {
                documentId: this.$route.params.id,
                type: this.$route.name.replace("-edit",""),
                lang: this.$route.params.lang,
                document: null,
                locale:undefined,
            }
        },

        created(){

            c2c[this.type].get(this.$route.params.id).then(response => {
                this.document=response.data
                this.locale = user.getLocaleStupid(this.document, this.$route.params.lang)
            });
        }
    }
</script>
