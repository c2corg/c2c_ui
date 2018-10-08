<template>
    <!-- TODO : v-if user admin -->
    <span>
        <a @click="$refs.mergeWindow.show()" v-tooltip="$gettext('Merge with other document')">
            <fa-icon icon="object-group" />
        </a>
        <modal-card ref="mergeWindow">
            <span slot="title" >
                <span v-translate>Merge documents</span>
            </span>

            <section>
                <div class="notification is-warning has-text-centered">
                    <strong v-translate>
                        Warning: This action cannot be undone!
                    </strong>
                </div>
                <p v-translate>
                    Merging a source document with a target document transfers all
                    associations of the source document to the target document, and sets up a
                    redirection from the source to the target document.
                </p>
                <p>
                    <strong v-translate>
                        Note that comments have to be transferred manually in Discourse before merging.
                    </strong>
                </p>
                <p>
                    <strong v-translate>Source:</strong>
                    <document-title :document="document" />
                    (<document-link :document="document">
                        {{ document.document_id }}
                    </document-link>)
                </p>
                <p>
                    <strong v-translate>Target:</strong>
                    <span v-if="targetDocument">
                        <document-title :document="targetDocument" />
                        (<document-link :document="targetDocument">
                            {{ targetDocument.document_id }}
                        </document-link>)
                    </span>
                    <document-finder
                        :type="document.type"
                        v-model="targetDocument"/>
                </p>
            </section>

            <footer slot="footer">
                <button
                    :disabled="targetDocument===null"
                    @click="mergeDocuments"
                    class="button is-success"
                    v-translate>
                    Merge documents
                </button>
                <button
                    @click="hide()"
                    class="button"
                    v-translate>
                    Cancel
                </button>
            </footer>
        </modal-card>
    </span>
</template>

<script>
    import c2c from '@/js/c2c'

    import { requireDocumentProperty } from '@/js/propertiesMixins.js'

    export default {
        mixins : [
            requireDocumentProperty
        ],

        data(){
            return {
                targetDocument:null,
            }
        },

        methods:{
            hide(){
                this.$refs.mergeWindow.hide()
            },

            mergeDocuments(){
                if (window.confirm(this.$gettext('Are you sure you want to merge?'))) {
                    c2c.moderator.mergeDocuments(
                        this.document.document_id,
                        this.targetDocument.document_id
                    ).then(() => {
                        // TODO feedback
                        this.hide()
                    })
                }
            }
        }
    }

</script>

<style scoped lang="scss">

.modal-card-body, .modal-card, .modal {
    overflow: visible !important;
  }

</style>
