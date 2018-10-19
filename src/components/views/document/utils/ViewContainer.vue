
<template>
    <div class="section">
        <div v-if="document">
            <html-header :title="title"/>
            <!-- TODO : if not found -->

            <div v-if="isVersionView" class="notification is-warning has-text-centered">
                <!-- TODO : translation -->
                <p>
                    This is an archived version of this page, as of {{ version.written_at | moment("YYYY-MM-DD hh:mm:ss") }}
                </p>

                <span v-if="!isFirstVersion">
                    (<diff-link :type="type" :id="documentId" :lang="$route.params.lang"
                                :version-from="previousVersionId"
                                :version-to="$route.params.version"/>)
                    <version-link
                        :type="type"
                        :id="documentId"
                        :lang="$route.params.lang"
                        :version="previousVersionId"
                        v-translate>
                        ← previous version
                    </version-link>
                </span>
                <span v-else v-translate>This is the first version</span>
                |
                <document-link :document="document" :lang="$route.params.lang" v-translate>
                    see actual version
                </document-link>
                (<diff-link :type="type" :id="documentId" :lang="$route.params.lang"
                            :version-from="$route.params.version"
                            version-to="last"/>)
                            |
                <span v-if="!isLastVersion">
                    <version-link
                        :type="type"
                        :id="documentId"
                        :lang="$route.params.lang"
                        :version="nextVersionId"
                        v-translate>
                        next version →
                    </version-link>
                    (<diff-link :type="type" :id="documentId" :lang="$route.params.lang"
                                :version-to="nextVersionId"
                                :version-from="$route.params.version"/>)
                </span>
                <span v-else v-translate>This is the last version</span>

                <p>
                    <icon-document type="profile"/>
                    <contributor-link :contributor="version"/> : <em>{{ version.comment }}</em>
                </p>
                <p>
                    <button
                        v-if="!isLastVersion"
                        @click="$refs.restoreVersionConfirmationWindow.show()"
                        class="button is-primary"
                        v-translate>
                        Restore this version
                    </button>
                </p>

            </div>

            <content-box>
                <span class="is-pulled-right">
                    <follow-button :document="document" />

                    <block-account-button
                        v-if="type=='profile'"
                        :document="document" />

                    <merge-document-button v-if="!isVersionView" :document="document" />
                    <lock-document-button v-if="!isVersionView" :document="document" />
                    <delete-document-button v-if="!isVersionView" :document="document" />
                    <delete-locale-button v-if="!isVersionView" :document="document"/>

                    <a
                        v-if="!isVersionView"
                        v-tooltip="$gettext('Edit associations')"
                        @click="$refs.associationsEditor.show()">
                        <fa-icon icon="link" />
                    </a>
                    <a
                        v-tooltip="$gettext('Add images')"
                        v-if="!isVersionView"
                        @click="$refs.imagesUploader.show()">
                        <icon-image />
                    </a>
                    <history-link
                        :type="type"
                        :id="document.document_id"
                        :lang="locale.lang"
                        v-tooltip="$gettext('History')">
                        <icon-history class="is-medium" />
                    </history-link>
                    <translate-button
                        v-if="!isVersionView"
                        :document="document"/>
                    <edit-link
                        v-if="!isVersionView"
                        :type="type"
                        :id="document.document_id"
                        :lang="locale.lang"
                        v-tooltip="$gettext('Edit')">
                        <icon-edit class="is-medium"/>
                    </edit-link>
                </span>
                <div class="title is-1">
                    <icon-document :type="type"/>
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

            <associations-editor ref="associationsEditor" :document="document"/>

            <modal-confirmation
                ref="restoreVersionConfirmationWindow"
                @confirm="restoreVersion">
                <span v-translate>
                    Are you sure you want to revert to this version of the document?
                </span>
            </modal-confirmation>
        </div>
    </div>

</template>

<script>
    import constants from '@/js/constants'
    import utils from '@/js/utils'
    import c2c from '@/js/c2c'
    import user from '@/js/user'

    import ImagesUploader from '@/components/imagesUploader/ImagesUploader'

    import AssociationsEditor from './associationsEditor/AssociationsEditor'

    import LockDocumentButton from './buttons/LockDocumentButton'
    import DeleteDocumentButton from './buttons/DeleteDocumentButton'
    import DeleteLocaleButton from './buttons/DeleteLocaleButton'
    import MergeDocumentButton from './buttons/MergeDocumentButton'
    import TranslateButton from './buttons/TranslateButton'
    import BlockAccountButton from './buttons/BlockAccountButton'
    import FollowButton from './buttons/FollowButton'

    export default {
        components:{
            ImagesUploader,
            AssociationsEditor,
            LockDocumentButton,
            DeleteDocumentButton,
            DeleteLocaleButton,
            MergeDocumentButton,
            TranslateButton,
            BlockAccountButton,
            FollowButton,
        },

        data() {
            return {
                promise:null,
                error:null, // TODO : what?
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

                let doc = this.isVersionView ? this.promise.data.document : this.promise.data

                if(doc){
                    if(this.isVersionView)
                        doc.currentLocale_ = user.getLocaleStupid(doc, this.$route.params.lang)
                    else
                        doc.currentLocale_ = user.getLocaleSmart(doc, this.$route.params.lang)
                }

                return doc
            },
            locale(){
                return this.document.currentLocale_
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


            /*
            * properties available when doc is loaded
            */
            title(){
                return this.document ? utils.getDocumentTitle(this.document, this.$route.params.lang) : undefined
            },

            isFirstVersion(){
                return !this.previousVersionId
            },

            isLastVersion(){
                return !this.nextVersionId
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
                console.log(this)
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

            restoreVersion(){
                this.$refs.restoreVersionConfirmationWindow.hide()
                c2c.moderator.revertDocument(
                    this.document.document_id,
                    this.locale.lang,
                    this.$route.params.version
                )
                // TODO : feedback
            }
        }
    }

</script>
