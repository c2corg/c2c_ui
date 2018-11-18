
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

        /*
        * properties computed when document is loaded
        */
        document(){
            if(!this.promise.data)
                return null

            let doc = this.isVersionView ? this.promise.data.document : this.promise.data

            if(doc){
                if(this.isNormalView)
                    doc.currentLocale_ = this.$documentUtils.getLocaleSmart(doc, this.$route.params.lang)
                else
                    doc.currentLocale_ = this.$documentUtils.getLocaleStupid(doc, this.$route.params.lang)
            }

            return doc
        },

        version(){
            if(!this.promise.data || !this.isVersionView)
                return null

            return this.promise.data.version
        },
        locale(){
            return this.document ? this.document.currentLocale_ : null
        },
        lang(){
            return this.locale ? this.locale.lang : null
        }
    },

    watch:{
        '$route': 'loadDocument',
    },

    created() {
        this.loadDocument()
    },

    methods:{
        loadDocument(){

            if(this.isVersionView){
                this.promise = c2c[this.documentType].getVersion(
                    this.documentId,
                    this.$route.params.lang,
                    this.$route.params.version
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
                this.promise = {data:this.draft}
            } else { // normal mode
                this.promise = c2c[this.documentType].get(this.documentId)
            }
        },
    }
}
