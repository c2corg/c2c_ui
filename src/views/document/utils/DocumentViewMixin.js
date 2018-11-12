
import constants from '@/js/constants'
import c2c from '@/apis/c2c'

import ViewContainer from './ViewContainer'

import CommentsBox from './boxes/CommentsBox'
import MapBox from './boxes/MapBox'
import RecentOutingsBox from './boxes/RecentOutingsBox'
import ToolBox from './boxes/ToolBox'
import AllRoutesBox from './boxes/AllRoutesBox'

import FieldView from './fieldViewers/FieldView'
import LabelValue from './fieldViewers/LabelValue'
import DoubleNumericField from './fieldViewers/DoubleNumericField'
import MarkdownSection from './fieldViewers/MarkdownSection'
import ProfilesLinks from './fieldViewers/ProfilesLinks'

export default {

    components: {
        ViewContainer,

        CommentsBox,
        DoubleNumericField,
        FieldView,
        LabelValue,
        MapBox,
        MarkdownSection,
        ProfilesLinks,
        RecentOutingsBox,
        ToolBox,
        AllRoutesBox,
    },

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
        isVersionView(){
            return this.$route.name.endsWith("-version")
        },
        isDraftView(){ // means preview for edit and add mode
            return this.$route.name.endsWith("-edit") || this.$route.name.endsWith("-add")
        },

        /*
        * properties computed when document is loaded
        */
        document(){
            if(!this.promise.data)
                return null

            let doc = this.isVersionView ? this.promise.data.document : this.promise.data

            if(doc){
                if(this.isVersionView || this.isDraftView)
                    doc.currentLocale_ = this.$documentUtils.getLocaleStupid(doc, this.$route.params.lang)
                else
                    doc.currentLocale_ = this.$documentUtils.getLocaleSmart(doc, this.$route.params.lang)
            }

            return doc
        },

        version(){
            if(!this.promise.data || !this.isVersionView)
                return null

            return this.promise.data.version
        },
        locale(){
            return this.document.currentLocale_
        },
        lang(){
            return this.locale ? this.locale.lang : undefined
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
