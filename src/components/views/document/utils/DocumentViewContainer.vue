
<template>
    <div class="section">
        <html-header :title="title"/>

        <div v-if="document">
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
                    <delete-locale-button
                        v-if="!isVersionView"
                        :document="document"
                        :locale="locale"/>
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

            <slot>
                Please insert document content
            </slot>
        </div>

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

</template>

<script>
    import constants from '@/js/constants.js'
    import utils from '@/js/utils.js'
    import c2c from '@/js/c2c'

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

        props:{
            document:{
                type:Object,
                required:true,
            },

            locale:{
                type:Object,
                required:true,
            },

            version:{
                type:Object,
                default:null,
            },
            previousVersionId:{
                type:Number,
                default:null,
            },
            nextVersionId:{
                type:Number,
                default:null,
            },
        },

        data() {
            return {
                error:null,
            }
        },

        computed:{
            documentId(){
                return this.document.document_id
            },

            type(){
                return constants.getDocumentType(this.document.type)
            },

            isVersionView(){
                return this.version !== null
            },

            title(){
                return utils.getDocumentTitle(this.document, this.$route.params.lang)
            },

            isFirstVersion(){
                return !this.previousVersionId
            },

            isLastVersion(){
                return !this.nextVersionId
            },
        },

        methods:{
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
