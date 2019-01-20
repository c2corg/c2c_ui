<template>
    <div class="section documents-view">
        <html-header :title="$gettext(documentType) + 's'"/>
        <div class="level is-mobile header-section">
            <div class="level-left">
                <span class="level-item">
                    <div class="dropdown is-hoverable">
                        <div class="dropdown-trigger">
                            <span class="title is-1">
                                {{ getDocumentTypeTitle(documentType) | uppercaseFirstLetter }}
                            </span>
                        </div>
                        <div class="dropdown-menu" role="menu">
                            <div class="dropdown-content">
                                <div
                                    v-for="type of ['route', 'waypoint', 'outing', 'image', 'book', 'area']"
                                    :key="type"
                                    v-if="type!==documentType"
                                    class="dropdown-item">
                                    <router-link
                                        :to="{name: type + 's', query:$route.query}"
                                        class="has-text-dark">
                                        <icon-document :document-type="type" />
                                        &nbsp;
                                        {{ getDocumentTypeTitle(type) | uppercaseFirstLetter }}
                                    </router-link>
                                </div>
                            </div>
                        </div>
                    </div>
                </span>

                <span v-if="!['area', 'profile', 'image'].includes(documentType)" class="level-item">
                    <add-link
                        :document-type="documentType"
                        :query="addQuery"
                        class="is-size-3"
                        :title="$gettext('Create')">
                        <fa-icon icon="plus-circle" />
                    </add-link>
                </span>
            </div>

            <div class="level-right" v-if="documentType!='profile'">
                <div class="level-item is-size-3 is-hidden-mobile">
                    <fa-icon
                        icon="th-list"
                        class="has-cursor-pointer"
                        :class="listMode ? 'has-text-primary' : ''"
                        :title="$gettext('List mode')"
                        @click="toogleProperty('listMode')" />
                    &nbsp;
                    <fa-icon
                        icon="th-large"
                        class="has-cursor-pointer"
                        :class="!listMode ? 'has-text-primary' : ''"
                        :title="$gettext('Cards mode')"
                        @click="toogleProperty('listMode')" />
                    &nbsp;
                    &nbsp;
                    <fa-icon
                        v-if="documentAreGeoLocalized"
                        icon="map-marked-alt"
                        class="has-cursor-pointer"
                        :class="{'has-text-primary':showMap}"
                        :title="showMap ? $gettext('Hide map') : $gettext('Show map')"
                        @click="toogleProperty('showMap')" />
                </div>
                <div class="level-item is-size-3 is-hidden-tablet">
                    <fa-icon
                        :icon="showMap ? 'map-marked-alt' : 'th-large'"
                        class="has-text-primary"
                        @click="toogleProperty('showMap')"/>
                </div>
            </div>
        </div>

        <div class="level is-mobile filter-section">
            <div class="level-left">
                <div class="level-item">
                    <query-items/>
                </div>
            </div>
        </div>

        <div class="columns result-section" :class="showMap ? 'mobile-result-map' : 'mobile-result-card'">
            <div class="column documents-container"
                 :class="{'is-12': !displayMap, 'is-8': displayMap}">

                <loading-notification :promise="promise"/>

                <image-cards v-if="documents && !listMode && documentType === 'image'" :documents="documents"/>

                <div v-if="documents && !listMode && documentType !== 'image'" class="columns is-multiline cards-list">
                    <div
                        v-for="(document, index) in documents.documents"
                        :key="index"
                        :class="{
                            'is-half':displayMap,
                            'is-one-third':!displayMap,
                        }"
                        class="column card-container"
                        @mouseenter="highlightedDocument = document"
                        @mouseleave="highlightedDocument = null">
                        <document-card :highlighted="highlightedDocument===document" :document="document"/>
                    </div>
                </div>

                <documents-table
                    v-if="listMode"
                    :documents="documents ? documents : {}"
                    :document-type="documentType"
                    class="documents-table"/>
            </div>
            <div v-show="documentAreGeoLocalized" class="column map-container">
                <map-view
                    v-if="displayMap"
                    ref="map"
                    :documents="documents ? documents.documents : []"
                    :highlighted-document="highlightedDocument"
                    @highlightDocument="highlightedDocument = arguments[0]"
                    show-filter-control
                    show-center-on-geolocation
                    show-recenter-on/>
            </div>
        </div>

        <page-selector :documents="documents"/>
    </div>
</template>

<script>

    import c2c from '@/js/apis/c2c'
    import constants from '@/js/constants'

    import QueryItems from './utils/QueryItems'
    import PageSelector from './utils/PageSelector'
    import ImageCards from './utils/ImageCards'

    const DocumentsTable = () => import(/* webpackChunkName: "data-table" */ '@/components/datatable/DocumentsTable')

    export default {
        name: 'DocumentsView',

        components: {
            QueryItems,
            PageSelector,
            DocumentsTable,
            ImageCards
        },

        data() {
            return {
                promise: null,

                // showMap is the user choise, if he wants to see the map, or not
                showMap: null,
                listMode: null,

                highlightedDocument: null
            }
        },

        computed: {
            documents() {
                return this.promise.data
            },
            documentType() {
                return this.$route.name.slice(0, -1)
            },
            documentAreGeoLocalized() {
                return constants.objectDefinitions[this.documentType].geoLocalized === true
            },
            displayMap() {
                return this.showMap && this.documentAreGeoLocalized
            },
            addQuery() {
                return {
                    act: this.$route.query.act
                }
            }
        },

        watch: {
            '$route': {
                handler: 'load',
                immediate: true
            }
        },

        methods: {

            load() {
                this.showMap = this.$localStorage.get(this.documentType + '.showMap', this.documentAreGeoLocalized)
                this.listMode = this.$localStorage.get(this.documentType + '.listMode', false)
                this.promise = c2c[this.documentType].getAll(this.$route.query)
            },

            toogleProperty(property) {
                this[property] = !this[property]
                this.$localStorage.set(`${this.documentType}.${property}`, this[property])
            },

            getDocumentTypeTitle(documentType) {
                return this.$gettext(documentType + 's')
            }
        }
    }
</script>

<style scoped lang="scss">

    @import '@/assets/sass/variables.scss';

    $section-padding: 1.5rem; //TODO find this variable
    $header-height : 34px;
    $header-margin-bottom : 1rem; //TODO find this variable
    $filter-height : 32px;
    $filter-padding-bottom : 1.5rem;
    $page-selector-height : 3rem;
    $result-height : calc(100vh - #{$navbar-height} - 2*#{$section-padding} - #{$header-height} - #{$header-margin-bottom} - #{$filter-padding-bottom} - #{$filter-height} - #{$page-selector-height}); //  - #{$bulma-section-padding}*2 - #{$header-height} - #{$filter-height} - #{$filter-padding}*2);
    $cards-gap:0.25rem;

    .documents-view{
    }

    .header-section{
    }

    .filter-section{
    }

    @media screen and (max-width: $tablet) {

        .map-container{
            height: $result-height;
            padding-left:0;
            padding-top:0;
            padding-bottom:0;
        }

        .mobile-result-map{
            margin-top:0;
            height:$result-height;

            .documents-container{
                display:None;
            }
        }

        .mobile-result-card{

            .map-container{
                visibility: hidden; // map does not like to be in a display none...
            }
        }
    }

    @media screen and (min-width: $tablet){
        .result-section{
            margin-top:0;
            height:$result-height;

            .documents-container{
                height:100%;
                overflow: auto;

                .cards-list{
                    padding-top:2px;
                    height:100%;
                }

                .documents-table{
                    height:100%;
                }

            //    transition:0.3s;
            }

            .map-container{
                min-height: 100%;
                padding-left:0;
                padding-top:0;
                padding-bottom:0;
            //    transition:0.3s;
            }
        }
    }

</style>
