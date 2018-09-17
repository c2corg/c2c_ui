
<template>
    <div class="section">

        <loading-notification :loaded="document!=null" :error="error"/>

        <div v-if="document">

            <div v-if="isVersionView" class="notification is-warning">
                This is an archived version of this page, as of {{ version.written_at | moment("YYYY-MM-DD hh:mm:ss") }}

                <br>

                <span v-if="previousVersionId">
                    (<diff-link :type="type" :id="documentId" :lang="$route.params.lang"
                                :version-from="previousVersionId"
                                :version-to="$route.params.version"/>)
                    <version-link :type="type" :id="documentId" :lang="$route.params.lang" :version="previousVersionId">
                        ← previous version
                    </version-link>
                </span>
                <span v-else>this is the first version</span>
                |
                <document-link :document="document" :lang="$route.params.lang">
                    see actual version
                </document-link>
                (<diff-link :type="type" :id="documentId" :lang="$route.params.lang"
                            :version-from="$route.params.version"
                            version-to="last"/>)
                            |
                <span v-if="nextVersionId">
                    <version-link :type="type" :id="documentId" :lang="$route.params.lang" :version="nextVersionId">
                        next version →
                    </version-link>
                    (<diff-link :type="type" :id="documentId" :lang="$route.params.lang"
                                :version-to="nextVersionId"
                                :version-from="$route.params.version"/>)
                </span>
                <span v-else>this is the last version</span>

                <br>
                <icon-document type="profile"/>
                <contributor-link :contributor="version"/> : <em>{{ version.comment }}</em>
            </div>

            <content-box class="title is-1">
                <icon-document :type="type"/>
                <document-title :document="document"/>
                <span class="is-pulled-right">
                    <history-link :type="type" :id="document.document_id" :lang="locale.lang">
                        <icon-history class="is-medium" />
                    </history-link>
                    <edit-link :type="type" :id="document.document_id" :lang="locale.lang">
                        <icon-edit class="is-medium"/>
                    </edit-link>
                </span>
            </content-box>

            <slot>
                Please insert document content
            </slot>
        </div>
    </div>

</template>

<script>
    import constants from '@/js/constants.js'

    export default {

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
            }
        },
    }

</script>
