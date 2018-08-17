<template>
    <div class="section">

        <div class="field is-grouped">
            <div class="control">
                <button class="button is-primary" @click="save">
                    Save
                </button>
            </div>
            <div class="control">
                <input type="text" class="input" placeholder="comment" v-model="comment"/>
            </div>
        </div>
        <component :is="type + '-edition-content'" v-if="document"
            :document="document" :locale="locale" :objectDefinition="constants.objectDefinitions[type]">
        </component>
    </div>
</template>

<script>
    import c2c from '@/js/c2c.js'
    import user from '@/js/user.js'
    import constants from '@/js/constants.js'

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
                constants,
                comment:"",
            }
        },

        created(){

            c2c[this.type].get(this.$route.params.id).then(response => {
                this.document=response.data
                this.locale = user.getLocaleStupid(this.document, this.$route.params.lang)
            });
        },

        methods:{
            save(){
                c2c[this.type].save(this.document, this.comment)
            }
        }
    }
</script>
