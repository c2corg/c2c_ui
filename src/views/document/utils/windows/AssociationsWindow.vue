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
            :propositions="propositions[item.arrayName]" />

        <div slot="footer">
            <button class="button is-primary" v-translate @click="$refs.modalCard.hide()">
                Close
            </button>
        </div>

    </modal-card>
</template>

<script>
    import c2c from '@/js/apis/c2c'
    import constants from '@/js/constants'

    import { requireDocumentProperty } from '@/js/properties-mixins'

    import AssociationItems from './AssociationItems'

    export default {

        components: { AssociationItems },
        mixins: [ requireDocumentProperty ],

        data() {
            return {
                promise: null,
                data: null,
                propositions: {},
                letterTypes: []
            }
        },

        computed: {
            dataArray() {
                return Object.values(this.data)
            }
        },

        created() {
            const associations = this.document.associations
            const fields = Object.values(constants.objectDefinitions[this.documentType].fields)

            this.data = {}

            for (let field of fields) {
                if (field.parent === 'associations') {
                    this.addToData(field.name, field.documentType + 's', associations[field.name])
                    this.letterTypes.push(constants.objectDefinitions[field.documentType].letter)
                }
            }
        },

        methods: {
            show() {
                this.$refs.modalCard.show()
            },

            // used by created function
            addToData(arrayName, documentType, documents) {
                this.data[documentType] = {
                    arrayName: arrayName,
                    documentType: documentType,
                    current: documents.documents ? documents.documents : documents
                }
            },

            search(event) {
                const text = event.target.value

                if (text.length >= 3) {
                    c2c.search({ q: text, t: this.letterTypes.join(','), limit: 5 }).then(this.computePropositions)
                }
            },

            computePropositions(response) {
                this.propositions = response.data
            }
        }
    }
</script>
