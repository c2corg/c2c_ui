
import constants from '@/js/constants.js'
import utils from '@/js/utils.js'
import user from '@/js/user.js'
import c2c from '@/js/c2c.js'

import DocumentViewContainer from './DocumentViewContainer'

import AssociatedDocuments from './AssociatedDocuments'
import CommentsBox from './CommentsBox'
import FieldView from './FieldView'
import LabelValue from './LabelValue'
import LangSwitcherBox from './LangSwitcherBox'
import LicenseBox from './LicenseBox'
import MapBox from './MapBox'
import MarkdownSection from './MarkdownSection'
import RecentOutingsBox from './RecentOutingsBox'
import UsersLinks from './UsersLinks'

export default {

    components: {
        DocumentViewContainer,

        AssociatedDocuments,
        CommentsBox,
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
            type:constants.getDocumentType(this.$route.name.split("-")[0]),
            document:null,
            error:null,
            locale: null,
            version: null,
            previousVersionId: null,
            nextVersionId: null,
            fields:null,
        }
    },

    computed:{
        documentId(){
            return parseInt(this.$route.params.id)
        },
        isVersionView(){
            return this.$route.name.endsWith("-version");
        },
    },

    created() {
        this.fields = constants.objectDefinitions[this.type].fields

        if(this.isVersionView){
            c2c[this.type].getVersion(this.documentId, this.$route.params.lang, this.$route.params.version)
            .then(response => {

                this.document = response.data.document

                //versionned datas are poor...
                this.document.areas = []
                this.document.creator = null
                this.document.associations = {
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

                this.locale = user.getLocaleStupid(this.document, this.$route.params.lang)
                this.version = response.data.version
                this.nextVersionId = parseInt(response.data.next_version_id)
                this.previousVersionId = parseInt(response.data.previous_version_id)
            })
            .catch(utils.getApiErrorHandler(this));

        } else {

            c2c[this.type].get(this.documentId)
            .then(response => {

                if(response.data.not_authorized===true){
                    this.error = "Sorry, you're not authorized to see this document"
                    return
                }

                this.document=response.data
                this.locale = user.getLocaleSmart(this.document, this.$route.params.lang)
            })
            .catch(utils.getApiErrorHandler(this));
        }
    },
}
