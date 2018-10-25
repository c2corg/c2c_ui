<template>
    <div class="section documents-view">
        <html-header :title="documentType"/>
        <div class="level is-mobile header-section">
            <div class="level-left">
                <span class="level-item">
                    <span class="title is-1 is-first-letter-uppercase">{{ $gettext(title) }}</span>
                </span>
            </div>
            <div class="level-right" v-if="documentType!='profile'">
                <span class="level-item">
                    <add-link :document-type="documentType" class="button is-rounded is-primary" />
                </span>
            </div>
        </div>

        <div class="level is-mobile filter-section">
            <div class="level-left">
                <div class="level-item">
                    <query-items/>
                </div>
            </div>
            <div class="level-right">
                <div class="level-item">
                    <span v-if="documentAreGeoLocalized" class="icon is-size-3">
                        <fa-icon
                            :icon="listMode ? 'th-list' : 'th-large'"
                            @click="toogleProperty('listMode')" />
                        <fa-icon
                            :class="{'has-text-primary':showMap}"
                            icon="map-marked-alt"
                            @click="toogleProperty('showMap')" />
                    </span>
                </div>
            </div>
        </div>

        <div class="columns">
            <div :class="{'is-12': !displayMap, 'is-8': displayMap}"
                 class="column cards-container">

                <loading-notification :promise="promise"/>

                <div v-if="documents && !listMode" class="columns is-multiline cards-list">
                    <div
                        v-for="(document, index) in documents.documents"
                        :key="index"
                        :class="{'is-one-third':displayMap, 'is-one-fifth':!displayMap}"
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
                    show-center-on-geolocation/>
            </div>
        </div>
    </div>
</template>

<script>

    import c2c from '@/apis/c2c'
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
                listMode: false,
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
            }
        },

        watch:{
            $route : 'loadElements',
        },

        created() {
            this.loadElements()
        },

        methods:{

            loadElements(){

                this.showMap = this.$localStorage.get(this.documentType + ".showMap", this.documentAreGeoLocalized)
                this.listMode = this.$localStorage.get(this.documentType + ".listMode", false)

                var offset = this.offset
                var query = Object.assign({offset : offset ? offset : undefined}, this.$route.query)

                this.promise = c2c[this.documentType].getAll(query)
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

    $header-margin-bottom : 1rem;
    $header-height : $header-margin-bottom + $size-1;
    $filter-padding : 1rem;
    $filter-height : 100px;
    $result-height : calc(100vh - #{$navbar-height} - #{$header-height} - 2*#{$filter-padding} - #{$filter-height}); //  - #{$bulma-section-padding}*2 - #{$header-height} - #{$filter-height} - #{$filter-padding}*2);
    $cards-gap:0.25rem;

    .documents-view{
    }

    .header-section{
    }

    .filter-section{
    }

    .result-section{
        height: $result-height;
    }

    .map-container{
        height: $result-height;
        position:relative;
        padding:0;
    }

    .cards-container{
        max-height: $result-height;
        overflow: auto;
    //    transition:0.3s;
    }

    .card-container{
        //transition:0.1s;
    }

    .cards-list{
        margin-left: -$cards-gap;
        margin-right: -$cards-gap;

    }
    .cards-list .column {
        padding-left: $cards-gap;
        padding-right: $cards-gap;
    }

</style>
