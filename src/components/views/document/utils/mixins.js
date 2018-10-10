
import constants from '@/js/constants.js'
import user from '@/js/user.js'
import c2c from '@/js/c2c'

import DocumentViewContainer from './DocumentViewContainer'

import AssociatedDocuments from './boxes/AssociatedDocuments'
import CommentsBox from './boxes/CommentsBox'
import LangSwitcherBox from './boxes/LangSwitcherBox'
import LicenseBox from './boxes/LicenseBox'
import MapBox from './boxes/MapBox'
import RecentOutingsBox from './boxes/RecentOutingsBox'

import FieldView from './fieldViewers/FieldView'
import LabelValue from './fieldViewers/LabelValue'
import DoubleNumericField from './fieldViewers/DoubleNumericField'
import MarkdownSection from './fieldViewers/MarkdownSection'
import UsersLinks from './fieldViewers/UsersLinks'

export default {

    components: {
        DocumentViewContainer,

        AssociatedDocuments,
        CommentsBox,
        DoubleNumericField,
        FieldView,
        LangSwitcherBox,
        LabelValue,
        LicenseBox,
        MapBox,
        MarkdownSection,
        RecentOutingsBox,
        UsersLinks,
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
        type(){
            return constants.getDocumentType(this.$route.name.split("-")[0])
        },
        fields(){
            return constants.objectDefinitions[this.type].fields
        },
        isVersionView(){
            return this.$route.name.endsWith("-version");
        },

        /*
        * properties computed when document is loaded
        */
        document(){
            if(!this.promise.data)
                return null

            return this.isVersionView ? this.promise.data.document : this.promise.data
        },
        locale(){
            return this.isVersionView ?
                user.getLocaleStupid(this.document, this.$route.params.lang)
                :
                user.getLocaleSmart(this.document, this.$route.params.lang)
        },

        /*
        * properties computed when document is loaded, in version mode
        */
        version(){
            return this.isVersionView ? this.promise.data.version : null
        },
        nextVersionId(){
            return this.isVersionView ? this.promise.data.next_version_id : null
        },
        previousVersionId(){
            return this.isVersionView ? this.promise.data.previous_version_id : null
        },
    },

    created() {

        if(this.isVersionView){
            this.promise = c2c[this.type].getVersion(
                this.documentId,
                this.$route.params.lang,
                this.$route.params.version
            ).then(response => {

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

        } else {

            this.promise = c2c[this.type].get(this.documentId).then(response => {
                if(response.data.not_authorized===true){
                    this.error = new Error("Sorry, you're not authorized to see this document")
                    return
                }
            })
        }
    },
}
