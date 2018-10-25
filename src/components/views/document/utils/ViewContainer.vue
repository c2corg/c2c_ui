
<template>
    <div class="section view-container">
        <div v-if="document && document.not_authorized" class="notification is-danger" v-translate>
            Sorry, you're not authorized to see this page.
        </div>

        <div v-else-if="document">
            <html-header :title="title"/>

            <document-version-banner
                v-if="isVersionView"
                :version="promise.data.version"
                :document="document"
                :next-version-id="promise.data.next_version_id"
                :previous-version-id="promise.data.previous_version_id" />

            <content-box>
                <span class="is-pulled-right button-bar no-print">

                    <follow-button :document="document" />

                    <history-link
                        v-tooltip="$gettext('History')"
                        :document-type="documentType"
                        :id="document.document_id"
                        :lang="locale.lang">
                        <icon-history />
                    </history-link>

                    <span
                        v-tooltip="$gettext('Add images')"
                        v-if="!isVersionView"
                        @click="$refs.imagesUploader.show()">
                        <icon-image />
                    </span>

                    <edit-link
                        v-if="!isVersionView"
                        :document="document"
                        :lang="locale.lang"
                        v-tooltip="$gettext('Edit')">
                        <icon-edit />
                    </edit-link>
                </span>
                <div class="title is-1">
                    <icon-document :document-type="documentType"/>
                    <document-title :document="document"/>
                </div>
            </content-box>

            <slot :document="document" :fields="fields">
                Please insert document content
            </slot>

            <images-uploader
                ref="imagesUploader"
                :lang="locale.lang"
                :parent-document="document"/>

        </div>
        <div v-if="promise.error" class="notification is-danger">
            <div v-for="(error, i) of promise.error.response.data.errors" :key="i">
                {{ error.description }}
            </div>
        </div>
    </div>

</template>

<script>
    import constants from '@/js/constants'
    import c2c from '@/apis/c2c'

    import ImagesUploader from '@/components/imagesUploader/ImagesUploader'

    import FollowButton from './FollowButton'
    import DocumentVersionBanner from './DocumentVersionBanner'

    export default {
        components:{
            ImagesUploader,
            FollowButton,
            DocumentVersionBanner,
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
                return this.$route.name.endsWith("-version");
            },

            /*
            * properties computed when document is loaded
            */
            document(){
                if(!this.promise.data)
                    return null

                let doc = this.isVersionView ? this.promise.data.document : this.promise.data

                if(doc){
                    if(this.isVersionView)
                        doc.currentLocale_ = this.$documentUtils.getLocaleStupid(doc, this.$route.params.lang)
                    else
                        doc.currentLocale_ = this.$documentUtils.getLocaleSmart(doc, this.$route.params.lang)
                }

                return doc
            },
            title(){
                return this.document ? this.$documentUtils.getDocumentTitle(this.document, this.locale.lang) : undefined
            },
            locale(){
                return this.document.currentLocale_
            },
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

                    this.promise = c2c[this.documentType].get(this.documentId).then(response => {
                        if(response.data.not_authorized===true){
                            // TODO : brancher ca au bon endroit
                            // this.error = new Error("Sorry, you're not authorized to see this document")
                            return
                        }
                    })
                }
            },
        }
    }

</script>

<style scoped lang="scss">

    @import '@/assets/sass/variables.scss';

    .button-bar{
        font-size:1.5rem;
    }

    .button-bar > a{
        color:$text;
    }

    .button-bar > span, .button-bar > a{
        margin-left:0.25rem;
        cursor:pointer;
    }
    .button-bar > *:hover{
        color:$black;
    }

</style>
