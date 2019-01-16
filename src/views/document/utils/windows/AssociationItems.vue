<template>
    <div class="association-items">
        <h2 class="title is-2">
            {{ $gettext(childType) | uppercaseFirstLetter }}
        </h2>

        <div
            v-for="child of current"
            :key="child.document_id"
            class="columns is-mobile is-gapless document-row">
            <div class="column">
                <document-link :document="child" />
            </div>
            <div class="column is-narrow">
                <button
                    class="button is-small is-pulled-right is-danger"
                    :class="{'is-loading': promise.loading}"
                    :disabled="!canRemove(child)"
                    @click="remove(child)">
                    Remove
                </button>
            </div>
        </div>

        <div
            v-for="child of filteredPropositions"
            :key="child.document_id"
            class="columns is-mobile is-gapless document-row">
            <div class="column">
                <document-link :document="child" />
            </div>
            <div class="column is-narrow">
                <button
                    class="button is-small is-pulled-right is-success"
                    :class="{'is-loading': promise.loading}"
                    @click="add(child)">
                    Add
                </button>
            </div>
        </div>
    </div>
</template>

<script>
    import c2c from '@/js/apis/c2c'

    export default {
        props: {

            parent: {
                type: Object,
                required: true
            },
            childType: {
                type: String,
                required: true
            },
            current: {
                type: Array,
                required: true
            },
            propositions: {
                type: Object,
                default: null
            }
        },

        data() {
            return {
                promise: {}
            }
        },

        computed: {
            // do not propose a document still in current
            filteredPropositions() {
                if (!this.propositions) {
                    return []
                }

                const currentIds = new Set(this.current.map(doc => doc.document_id))

                return this.propositions.documents.filter(doc => !currentIds.has(doc.document_id))
            }
        },

        methods: {
            canRemove(document) {
                return this.$user.isModerator
            },

            add(child) {
                this.promise = c2c.association.create(this.parent, child)
                    .then((response) => {
                        this.current.push(child)
                    })
            },

            remove(child) {
                this.promise = c2c.association.remove(this.parent, child)
                    .then((response) => {
                        this.current = this.current.filter(doc => doc.document_id !== child.document_id)
                    })
            }
        }
    }
</script>

<style scoped lang="scss">

    @import '@/assets/sass/variables.scss';

    .association-items{
        margin-bottom: 1rem;

        h2{
            margin-bottom: 0.1rem!important;
        }
    }

    .document-row{
        padding:2px;
        margin-bottom: 0!important;
    }
    .document-row:hover{
        background: $hover-background;
    }

</style>
