<template>
    <div class="association-items">
        <h2 class="title is-2">
            {{ $gettext(childType) | uppercaseFirstLetter }}
        </h2>

        <div
            v-for="child of childs"
            :key="child.document.document_id"
            class="columns is-mobile is-gapless document-row">
            <div class="column">
                <document-link :document="child.document" />
            </div>
            <div class="column is-narrow">
                <button
                    class="button is-small is-pulled-right"
                    :class="{
                        'is-loading': promise.loading,
                        'is-danger': child.status === 'current',
                        'is-info': child.status === 'deleted',
                        'is-success': child.status === 'proposition',
                    }"
                    :disabled="child.disabled"
                    @click="onclick(child)">
                    {{ child.buttonLabel }}
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
                promise: {},
                deleted: []
            }
        },

        computed: {

            childs() {
                const uniqueDocuments = new Map()

                const append = function(array, status, buttonLabel) {
                    for (let document of array || []) {
                        if (!uniqueDocuments.has(document.document_id)) {
                            uniqueDocuments.set(document.document_id, {
                                sortKey: this.$documentUtils.getDocumentTitle(document).toLowerCase() + document.document_id,
                                document,
                                status,
                                buttonLabel,
                                disabled: !this.canRemove(document) && status === 'current'
                            })
                        }
                    }
                }.bind(this)

                append(this.current, 'current', this.$gettext('Remove'))
                append(this.deleted, 'deleted', this.$gettext('Put it back'))
                append(this.propositions ? this.propositions.documents : undefined, 'proposition', this.$gettext('Add'))

                let result = [...uniqueDocuments.values()]
                result.sort((a, b) => {
                    return a.sortKey < b.sortKey ? -1 : 1
                })

                return result
            }
        },

        methods: {
            canRemove(document) {
                if (this.parent.type === 'o' && this.childType === 'routes') {
                    return this.current.length > 1
                }

                return (this.$user.isModerator || this.parent.document_id === this.$user.id)
            },

            onclick(child) {
                if (child.status === 'current') {
                    this.remove(child.document)
                } else {
                    this.add(child.document)
                }
            },

            add(child) {
                this.promise = c2c.association.create(this.parent, child)
                    .then((response) => {
                        this.current.push(child)
                        this.deleted = this.deleted.filter(doc => doc.document_id !== child.document_id)
                    })
            },

            remove(child) {
                this.promise = c2c.association.remove(this.parent, child)
                    .then((response) => {
                        this.current.splice(this.current.indexOf(child), 1)
                        this.deleted.push(child)
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
