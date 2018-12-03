<template>
    <div class="section documents-view">
        <html-header :title="$gettext(documentType)"/>
        <div class="level is-mobile header-section">
            <div class="level-left">
                <span class="level-item">
                    <span class="title is-1 is-first-letter-uppercase">{{ $gettext(title) }}</span>
                </span>

                <span class="level-item">
                    <add-link
                        :document-type="documentType"
                        :query="addQuery"
                        class="is-size-3"
                        v-tooltip:right="$gettext('Create')">
                        <fa-icon icon="plus-circle" />
                    </add-link>
                </span>
            </div>
            <div class="level-right" v-if="documentType!='profile'">

                <div class="level-item is-size-3">
                    <fa-icon
                        :icon="listMode ? 'th-list' : 'th-large'"
                        @click="toogleProperty('listMode')" />
                    <div class="level-item is-size-3"/>
                    <fa-icon
                        v-if="documentAreGeoLocalized"
                        :class="{'has-text-primary':showMap}"
                        icon="map-marked-alt"
                        @click="toogleProperty('showMap')" />
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

        <div class="columns result-section">
            <div class="column cards-container"
                 :class="{'is-12': !displayMap, 'is-8': displayMap}">

                <loading-notification :promise="promise"/>

                <div v-if="documents && !listMode" class="columns is-multiline cards-list">
                    <div
                        v-for="(document, index) in documents.documents"
                        :key="index"
                        :class="{'is-half':displayMap, 'is-one-third':!displayMap}"
                        class="column card-container"
                        @mouseleave="mouseLeave(document)"
                        @mouseenter="mouseEnter(document)">
                        <document-card :document="document"/>
                    </div>
                </div>

                <data-table
                    v-if="documents!=null && listMode"
                    :documents="documents"
                    :document-type="documentType"/>

                <page-selector v-if="documents!=null" :documents="documents"/>
            </div>
            <!--  Note : we use v-if, because v-if introduce a bug. -->
            <!-- Try to swith from /articles to /outings... -->
            <div v-show="documentAreGeoLocalized" class="column map-container">
                <map-view
                    v-if="displayMap"
                    ref="map"
                    :documents="documents ? documents.documents : []"
                    show-filter-control
                    show-center-on-geolocation
                    show-recenter-on/>
            </div>
        </div>
    </div>
</template>

<script>

    import c2c from '@/js/apis/c2c'
    import constants from '@/js/constants'

    import QueryItems from './utils/QueryItems'
    import PageSelector from './utils/PageSelector'

    import DataTable from '@/components/datatable/DataTable'

    export default {
        name:"DocumentsView",

        components: {
            QueryItems,
            PageSelector,
            DataTable,
        },

        data() {
            return {
                promise: null,

                // showMap is the user choise, if he wants to see the map, or not
                showMap: null,
                listMode: null,
            }
        },

        computed:{
            documents(){
                return this.promise.data
            },
            title(){
                var result = this.$route.name
                return result.charAt(0).toUpperCase() + result.slice(1);
            },
            documentType(){
                return this.$route.name.slice(0, -1)
            },
            documentAreGeoLocalized(){
                return constants.objectDefinitions[this.documentType].geoLocalized===true
            },
            displayMap(){
                return this.showMap && this.documentAreGeoLocalized
            },
            addQuery(){
                return {
                    act: this.$route.query.act,
                }
            },
        },

        watch:{
            "$route" : {
                handler: 'load',
                immediate: true,
            },
        },

        methods:{

            load(){

                this.showMap = this.$localStorage.get(this.documentType + ".showMap", this.documentAreGeoLocalized)
                this.listMode = this.$localStorage.get(this.documentType + ".listMode", false)
                this.promise = c2c[this.documentType].getAll(this.$route.query)
            },

            toogleProperty(property){
                this[property] = !this[property]
                this.$localStorage.set(`${this.documentType}.${property}`, this[property])
            },

            mouseEnter(document){
                if(this.documentAreGeoLocalized && this.displayMap)
                    this.$refs.map.highlightedDocument = document
            },

            mouseLeave(){
                if(this.documentAreGeoLocalized && this.displayMap)
                    this.$refs.map.highlightedDocument = null
            },
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
    $result-height : calc(100vh - #{$navbar-height} - 2*#{$section-padding} - #{$header-height} - #{$header-margin-bottom} - #{$filter-padding-bottom} - #{$filter-height}); //  - #{$bulma-section-padding}*2 - #{$header-height} - #{$filter-height} - #{$filter-padding}*2);
    $cards-gap:0.25rem;

    .documents-view{
    }

    .header-section{
    }

    .filter-section{
    }

    .result-section{
        margin-top:0;
        height:$result-height;

        .cards-container{
            padding-top:2px;
            overflow: auto;
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

</style>
