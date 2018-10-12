<template>
    <div class="section documents-view">
        <html-header :title="type"/>
        <div class="level is-mobile header-section">
            <div class="level-left">
                <span class="level-item">
                    <span class="title is-1 is-first-letter-uppercase">{{ $gettext(title) }}</span>
                </span>
            </div>
            <div class="level-right" v-if="type!='profile'">
                <span class="level-item">
                    <add-link :type="type" class="button is-rounded is-primary" />
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
                    <span v-if="hasMap" class="icon is-size-3">
                        <fa-icon
                            :icon="listMode ? 'th-list' : 'th-large'"
                            @click="listMode=!listMode" />
                        <fa-icon
                            :class="{'has-text-primary':showMap}"
                            icon="map-marked-alt"
                            @click="showMap=!showMap" />
                    </span>
                </div>
            </div>
        </div>

        <div class="columns">
            <div :class="{'is-12': !showMap, 'is-8': showMap}"
                 class="column cards-container">

                <loading-notification :promise="promise"/>

                <div v-if="documents && !listMode" class="columns is-multiline cards-list">
                    <div
                        v-for="(document, index) in documents.documents"
                        :key="index"
                        :class="{'is-one-third':showMap, 'is-one-fifth':!showMap}"
                        class="column card-container"
                        @mouseleave="mouseLeave(document)"
                        @mouseenter="mouseEnter(document)">
                        <document-card :document="document"/>
                    </div>
                </div>

                <data-table v-if="documents!=null && listMode" :documents="documents" :type="type"/>

                <page-selector v-if="documents!=null" :documents="documents"/>

            </div>

            <div v-if="hasMap" class="column map-container">
                <map-view
                    ref="map"
                    :documents="documents ? documents.documents : []"
                    show-filter-control
                    show-center-on-geolocation/>
            </div>
        </div>
    </div>
</template>

<script>

    import c2c from '@/js/c2c'
    import constants from '@/js/constants.js'

    import QueryItems from './utils/QueryItems'
    import PageSelector from './utils/PageSelector'

    import DataTable from '@/components/datatable/DataTable'

    export default {
        components: {
            QueryItems,
            PageSelector,
            DataTable,
        },

        data() {
            return {
                promise: null,
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
            type(){
                return this.$route.name.slice(0, -1)
            },
            hasMap(){
                return constants.objectDefinitions[this.type].geoLocalized===true
            },
        },

        watch:{
            $route : 'loadElements',
        },

        created() {
            this.showMap = this.hasMap;
            this.loadElements();
        },

        methods:{

            loadElements(){
                var offset = this.offset
                var query = Object.assign({offset : offset ? offset : undefined}, this.$route.query)

                this.promise = c2c[this.type].getAll(query)
            },

            mouseEnter(document){
                if(this.hasMap)
                    this.$refs.map.highlightedDocument = document
            },

            mouseLeave(){
                if(this.hasMap)
                    this.$refs.map.highlightedDocument = null
            }
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
    transition:0.3s;
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
