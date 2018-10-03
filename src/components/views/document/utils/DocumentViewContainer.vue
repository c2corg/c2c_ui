
<template>
    <div class="section">
        <html-header :title="title"/>

        <div v-if="document">
            <!-- TODO : if not found -->

            <div v-if="isVersionView" class="notification is-warning">
                <!-- TODO : translation -->
                This is an archived version of this page, as of {{ version.written_at | moment("YYYY-MM-DD hh:mm:ss") }}

                <br>

                <span v-if="previousVersionId">
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
                <span v-else v-translate>this is the first version</span>
                |
                <document-link :document="document" :lang="$route.params.lang" v-translate>
                    see actual version
                </document-link>
                (<diff-link :type="type" :id="documentId" :lang="$route.params.lang"
                            :version-from="$route.params.version"
                            version-to="last"/>)
                            |
                <span v-if="nextVersionId">
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
                <span v-else v-translate>this is the last version</span>

                <br>
                <icon-document type="profile"/>
                <contributor-link :contributor="version"/> : <em>{{ version.comment }}</em>
            </div>

            <content-box class="title is-1">
                <icon-document :type="type"/>
                <document-title :document="document"/>
                <span class="is-pulled-right">
                    <lock-document-button :document="document" />
                    <delete-document-button :document="document" />
                    <a
                        v-if="!isVersionView"
                        v-tooltip="$gettext('Edit associations')"
                        @click="showAssociationEditor=true">
                        <fa-icon icon="link" />
                    </a>
                    <a
                        v-tooltip="$gettext('Add images')"
                        v-if="!isVersionView"
                        @click="showImagesUploader=true">
                        <icon-image />
                    </a>
                    <history-link
                        :type="type"
                        :id="document.document_id"
                        :lang="locale.lang"
                        v-tooltip="$gettext('History')">
                        <icon-history class="is-medium" />
                    </history-link>
                    <edit-link
                        :type="type"
                        :id="document.document_id"
                        :lang="locale.lang"
                        v-tooltip="$gettext('Edit')">
                        <icon-edit class="is-medium"/>
                    </edit-link>
                </span>
            </content-box>

            <slot>
                Please insert document content
            </slot>
        </div>

        <images-uploader
            :lang="locale.lang"
            :parent-document="document"
            :visible="showImagesUploader"
            @hide="showImagesUploader=false"/>


        <associations-editor
            :document="document"
            :visible="showAssociationEditor"
            @hide="showAssociationEditor=false"/>
    </div>

</template>

<script>
    import constants from '@/js/constants.js'
    import utils from '@/js/utils.js'

    import AssociationsEditor from '@/components/associationsEditor/AssociationsEditor'
    import ImagesUploader from '@/components/imagesUploader/ImagesUploader'

    import LockDocumentButton from './LockDocumentButton'
    import DeleteDocumentButton from './DeleteDocumentButton'

    export default {
        components:{
            ImagesUploader,
            AssociationsEditor,
            LockDocumentButton,
            DeleteDocumentButton,
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
                showImagesUploader:false,
                showAssociationEditor:false,
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
        },
    }

</script>
