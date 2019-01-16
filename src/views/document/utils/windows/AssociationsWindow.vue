<template>
    <modal-card ref="modalCard">
        <div slot="title">
            <div class="control">
                <div class="field">
                    <input
                        class="input"
                        :placeholder="$gettext('Search a document to associate...')"
                        @input="search">
                </div>
            </div>
        </div>

        <association-items
            v-for="item of data"
            :key="item.documentType"
            :child-type="item.documentType"
            :parent="document"
            :current="item.current"
            :propositions="propositions[item.documentType]" />

        <div slot="footer">
            <button class="button is-primary" v-translate @click="$refs.modalCard.hide()">
                Close
            </button>
        </div>

    </modal-card>
</template>

<script>
    import c2c from '@/js/apis/c2c'
    import { requireDocumentProperty } from '@/js/properties-mixins'

    import AssociationItems from './AssociationItems'

    export default {

        components: { AssociationItems },
        mixins: [ requireDocumentProperty ],

        data() {
            return {
                promise: null,
                data: null,
                propositions: {}
            }
        },

        computed: {
            dataArray() {
                return Object.values(this.data)
            }
        },

        created() {
            const associations = this.document.associations
            this.data = {}

            this.addToData('routes', associations.all_routes)
            this.addToData('routes', associations.routes)
            this.addToData('waypoints', associations.waypoints)
            this.addToData('articles', associations.articles)
            this.addToData('books', associations.books)
            this.addToData('images', associations.images)
            this.addToData('xreports', associations.xreports)
        },

        methods: {
            show() {
                this.$refs.modalCard.show()
            },

            // used by created function
            addToData(documentType, documents) {
                if (documents !== undefined) {
                    this.data[documentType] = {
                        documentType: documentType,
                        current: documents.documents ? documents.documents : documents
                    }
                }
            },

            search(event) {
                const text = event.target.value

                if (text.length >= 3) {
                    c2c.search({ q: text, t: 'r,w,x,b,c', limit: 5 }).then(this.computePropositions)
                }
            },

            computePropositions(response) {
                this.propositions = response.data
            }
        }
    }
</script>
