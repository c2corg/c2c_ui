<template>
    <div class="dropdown control" :class="{'is-active':promise.data}">
        <div class="control has-icons-left input-container">
            <input
                class="input"
                :class="{'is-danger':hasError}"
                type="text"
                :placeholder="$gettext('Search ...')"
                @input="loadOptions"
                @focus="loadOptions"
                @blur="promise={}"
                v-model="searchText">
            <span class="icon is-left">
                <fa-icon icon="search"/>
            </span>
        </div>
        <div class="dropdown-menu" role="menu" v-if="promise.data">
            <div class="dropdown-content">
                <div
                    v-for="type of documentTypes_"
                    :key="type"
                    v-if="promise.data[type + 's'] && promise.data[type + 's'].documents.length !== 0">
                    <div
                        v-if="documentTypes_.length > 1"
                        class="dropdown-item has-text-weight-bold is-size-5 is-first-letter-uppercase">
                        <span>
                            {{ $gettext(type + 's') }}
                        </span>
                    </div>
                    <div
                        v-for="document of promise.data[type + 's'].documents"
                        :key="document.document_id"
                        @mousedown="toggle(document)"
                        class="dropdown-item dropdown-item-option columns is-gapless">

                        <div
                            v-if="isSelected(document)"
                            class="column has-text-success is-size-1 is-narrow">
                            <fa-icon icon="check-circle"/>
                        </div>

                        <div class="column is-size-6">
                            <document-title :document="document"/>
                            <br>
                            <span v-if="document.elevation || document.elevation_max">
                                <span v-tooltip="$gettext('elevation_max')">
                                    <fa-icon icon="sort-amount-up" class="has-text-primary"/>
                                </span>
                                {{ document.elevation || document.elevation_max }}&nbsp;m
                            </span>

                            <span v-if="document.height_diff_up">
                                <icon-height-diff-up class="has-text-primary"/>
                                {{ document.height_diff_up }}&nbsp;m
                            </span>
                            <span v-if="document.forum_username" class="is-italic">
                                @{{ document.forum_username }}
                            </span>
                            <span v-if="document.area_type" class="is-italic">
                                {{ $gettext(document.area_type) }}
                            </span>

                            &nbsp;
                        </div>

                        <div class="column has-text-primary is-size-2 is-narrow">
                            <icon-document v-if="document.type=='u'" document-type="profile" />
                            <icon-document v-else-if="document.type=='a'" document-type="area" />
                            <activities v-else-if="document.activities" :activities="document.activities" />
                            <icon-waypoint-type v-else-if="document.waypoint_type" :waypoint-type="document.waypoint_type" />
                        </div>
                    </div>
                </div>

                <div v-if="proposeCreation">
                    <hr class="dropdown-divider">
                    <div

                        class="dropdown-item has-text-weight-bold is-size-5 is-first-letter-uppercase"
                        v-translate>
                        No match?
                    </div>
                    <add-link
                        v-for="type of documentTypes_"
                        :key="type + '_add'"
                        :document-type="type"
                        class="dropdown-item dropdown-item-option is-size-6">
                        {{ $gettext('Create a new ' + type) }}
                    </add-link>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
    import c2c from '@/js/apis/c2c'
    import constants from '@/js/constants'

    import { baseMixin, arrayMixin } from './mixins.js'

    export default {
        mixins: [ baseMixin, arrayMixin ],

        props: {

            value: {
                type: [Array, Object],
                default: null
            },
            multiple: {
                type: Boolean,
                default: false
            },
            documentType: {
                type: [Array, String],
                required: true
            },
            proposeCreation: {
                type: Boolean,
                default: false
            }
        },

        data() {
            return {
                searchText: '',
                promise: {}
            }
        },

        computed: {
            value_: {
                get() {
                    return this.multiple ? (this.value ? this.value : []) : this.value
                },
                set(value) {
                    if (!this.disabled) {
                        this.$emit('input', value)
                    }
                }
            },

            documentTypes_() {
                return Array.isArray(this.documentType) ? this.documentType : [this.documentType]
            },

            letterTypes() {
                return this.documentTypes_.map(item => constants.objectDefinitions[item].letter)
            }
        },

        methods: {
            loadOptions() {
                if (!this.searchText || this.searchText.length < 3) {
                    this.promise = {}
                    return
                }

                this.promise = c2c.search({
                    q: this.searchText,
                    t: this.letterTypes.join(','),
                    limit: 7
                }).then((response) => {
                    response.data.profiles = response.data.users
                })
            },

            isSelected(value) {
                if (this.multiple) {
                    return this.$documentUtils.isInArray(this.value_, value)
                } else {
                    return this.value ? this.value.document_id === value.document_id : false
                }
            },

            toggle(value) {
                if (!this.multiple) {
                    this.value_ = value
                    if (value) {
                        this.$emit('add', value)
                    }
                } else {
                    const newValue = []
                    let removed = false

                    for (const document of this.value_) {
                        if (document.document_id === value.document_id) {
                            removed = true
                        } else {
                            newValue.push(document)
                        }
                    }

                    if (!removed) {
                        newValue.push(value)
                        this.$emit('add', value)
                    }

                    this.value_ = newValue
                }
            }
        }
    }
</script>

<style scoped>

    /* overwrite bulma value */
    .dropdown-item{
        padding:0.2rem 1rem;  /* 0.375rem 1rem */
    }

    div.dropdown-item-option{
        cursor:pointer;
    }

    div.dropdown-item-option:hover{
        background: #EEE; /* TODO variables */
    }

    .input-container{
        width:100%;
    }

    .dropdown-menu{
        max-width:30rem;
        min-width:30rem;
    }
    .dropdown-content{
        max-height:80vh;
        overflow-y: auto;
    }
    .columns{
        margin-bottom:0!important;
    }

</style>
