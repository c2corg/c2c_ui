
import constants from '@/js/constants'
import c2c from '@/js/apis/c2c'

import viewModeMixin from './view-mode-mixin'

import DocumentViewHeader from './DocumentViewHeader'
import CommentsBox from './boxes/CommentsBox'
import MapBox from './boxes/MapBox'
import ImagesBox from './boxes/ImagesBox'
import RecentOutingsBox from './boxes/RecentOutingsBox'
import ToolBox from './boxes/ToolBox'
import RoutesBox from './boxes/RoutesBox'

import FieldView from './field-viewers/FieldView'
import LabelValue from './field-viewers/LabelValue'
import DoubleNumericField from './field-viewers/DoubleNumericField'
import MarkdownSection from './field-viewers/MarkdownSection'
import ProfilesLinks from './field-viewers/ProfilesLinks'

export default {

    components: {
        DocumentViewHeader,

        CommentsBox,
        DoubleNumericField,
        FieldView,
        LabelValue,
        MapBox,
        MarkdownSection,
        ProfilesLinks,
        RecentOutingsBox,
        ToolBox,
        RoutesBox,
        ImagesBox,
    },

    mixins : [ viewModeMixin ],


    props:{
        draft:{
            type:Object,
            default:null,
        }
    },

    data() {
        return {
            promise:null,
        }
    },

    computed:{
        /*
        * properties that are deducted from URL
        */
        documentId(){
            return parseInt(this.$route.params.id)
        },
        documentType(){
            return this.$route.name.split("-")[0]
        },
        fields(){
            return constants.objectDefinitions[this.documentType].fields
        },
        expected_lang(){
            return this.$route.params.lang || this.$language.current || "fr"
        },

        /*
        * properties computed when document is loaded
        */
        document(){
            if(!this.promise || !this.promise.data)
                return null

            let doc = this.isVersionView ? this.promise.data.document : this.promise.data

            return doc
        },

        version(){
            if(!this.promise.data || !this.isVersionView)
                return null

            return this.promise.data.version
        },

        locale(){
            return this.document ? this.document.cooked : null
        },

        lang(){
            return this.document ? this.document.cooked.lang : null
        }
    },

    watch:{
        '$route': {
            handler: 'loadDocument',
            immediate: true
        },
    },

    methods:{
        loadDocument($route){

            if(this.isVersionView){
                this.promise = c2c[this.documentType].getVersion(
                    this.documentId,
                    this.$route.params.lang,
                    this.$route.params.version,
                    true,
                ).then(response => {

                    //version object with all data
                    response.data.version.next_version_id = response.data.next_version_id
                    response.data.version.previous_version_id = response.data.previous_version_id

                    //versionned datas are poor...
                    response.data.document.areas = []
                    response.data.document.creator = null
                    response.data.document.associations = {
                        articles:[],
                        books:[],
                        images:[],
                        users:[],
                        waypoints:[],
                        waypoint_children:[],
                        all_routes:{
                            documents:[],
                        },
                        recent_outings:{
                            documents:[],
                        }
                    }
                })

            } else if(this.isDraftView){
                this.promise = {}

                c2c.cooker(this.draft.locales[0]).then(response => {
                    this.draft.cooked = response.data
                    this.promise.data = this.draft
                })

            } else { // normal mode

                if(this.document && $route.params.id == this.document.document_id && this.expected_lang === this.lang)
                    return

                this.promise = c2c[this.documentType].getCooked(this.documentId, this.expected_lang).then(this.updateUrl)
            }
        },

        updateUrl(){
            var title = this.$documentUtils.getDocumentTitle(this.document, this.lang)
            title = title.toLowerCase().replace(/[^a-z0-1]+/g, "-")
            const path = `/${this.documentType}s/${this.documentId}/${this.lang}/${title}`
            this.$router.replace(path)
        }
    }
}
