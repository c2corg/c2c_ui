<template>
    <div v-if="version" class="notification is-warning has-text-centered">
        <!-- TODO : translation -->
        <p>
            This is an archived version of this page, as of {{ version.written_at | moment("YYYY-MM-DD hh:mm:ss") }}
        </p>

        <span v-if="!isFirstVersion">
            (<diff-link
                :document-type="documentType"
                :id="document.document_id"
                :lang="$route.params.lang"
                :version-from="version.previousVersionId"
                :version-to="$route.params.version"/>)
            <version-link
                :document-type="documentType"
                :id="document.document_id"
                :lang="$route.params.lang"
                :version="version.previousVersionId">
                ←
                <span v-translate>previous version</span>
            </version-link>
        </span>
        <span v-else v-translate>This is the first version</span>
        |
        <document-link :document="document" :lang="$route.params.lang" v-translate>
            see actual version
        </document-link>
        (<diff-link
            :document-type="documentType"
            :id="document.document_id"
            :lang="$route.params.lang"
            :version-from="$route.params.version"
            version-to="last"/>)
            |
        <span v-if="!isLastVersion">
            <version-link
                :document-type="documentType"
                :id="document.document_id"
                :lang="$route.params.lang"
                :version="version.nextVersionId">
                <span v-translate>next version</span>
                →
            </version-link>
            (<diff-link
                :document-type="documentType"
                :id="document.document_id"
                :lang="$route.params.lang"
                :version-to="version.nextVersionId"
                :version-from="$route.params.version"/>)
        </span>
        <span v-else v-translate>This is the last version</span>

        <p>
            <icon-document document-type="profile"/>
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

        <revert-version-window ref="restoreVersionConfirmationWindow" :document="document" />
    </div>
</template>

<script>

    import { requireDocumentProperty } from '@/js/propertiesMixins.js'
    import RevertVersionWindow from './windows/RevertVersionWindow'

    export default {
        components : { RevertVersionWindow },

        mixins : [ requireDocumentProperty ],

        props:{
            version:{
                type:Object,
                default:null,
            }
        },

        computed:{
            isFirstVersion(){
                return !this.version.previousVersionId
            },
            isLastVersion(){
                return !this.version.nextVersionId
            },
        }
    }
</script>
