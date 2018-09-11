<template>
    <div class="section documents-view">
        <div class="level is-mobile header-section">
            <div class="level-left">
                <span class="level-item">
                    <span class="title is-1 is-first-letter-uppercase">{{title}}</span>
                </span>
            </div>
            <div class="level-right">
                <span class="level-item">
                    <add-link :type="type" class="button is-rounded is-primary">
                        Add a {{type}}
                    </add-link>
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
                    <span class="icon is-size-3" v-if="hasMap">
                        <i class="fas fa-map-marked-alt"
                        :class="{'has-text-primary':showMap}"
                        @click="showMap=!showMap" />
                    </span>
                </div>
            </div>
        </div>

        <div class="columns">
            <div class="column cards-container">

                <loading-notification :loaded="documents!=null" :error="error"/>

                <div v-if="documents" class="columns is-multiline cards-list">
                    <div v-for="(document, index) in documents.documents" :key="index" class="column is-4">
                        <document-card :document="document"/>
                    </div>
                </div>

                <page-selector :documents="documents" v-if="documents!=null"/>
            </div>

            <div class="column is-4 map-container"
                 :class="{'is-hidden': !showMap}"
                 v-if="hasMap">
                <map-view :documents="documents" style="width: 100%; height: 100%">
                </map-view>
            </div>
        </div>
    </div>
</template>

<script>

    import c2c from '@/js/c2c.js'
    import utils from '@/js/utils.js'
    import constants from '@/js/constants.js'

    import DocumentCard from '@/components/cards/DocumentCard'
    import QueryItems from './QueryItems'
    import PageSelector from './PageSelector'

    export default {
        components: {
            QueryItems,
            PageSelector,
            DocumentCard,
        },

        data() {
            return {
                documents: null,
                error: null,
                showMap: true,
            }
        },

        computed:{
            title(){
                return this.$route.name
            },
            type(){
                return this.$route.name.slice(0, -1)
            },
            hasMap(){
                return constants.objectDefinitions[this.type].geoLocalized===true
            },
        },

        watch:{
            $route(){
                this.loadElements();
            }
        },

        created() {
            this.loadElements();
        },

        methods:{

            loadElements : function(){
                var offset = this.offset

                var query = Object.assign({offset : offset ? offset : undefined}, this.$route.query)

                c2c[this.$route.name].get(query)
                .then(response => { this.documents=response.data})
                .catch(utils.getApiErrorHandler(this));
            },
        }
    }
</script>

<style scoped lang="scss">

@import '@/assets/sass/main.scss';

$bulma-section-padding : 1rem;
$header-margin-bottom : 1rem;
$header-height : $header-margin-bottom + $size-1;
$filter-padding : 1rem;
$filter-height : 100px;
$result-height : calc(100vh - #{$navbar-height} - #{$header-height} - 2*#{$filter-padding} - #{$filter-height}); //  - #{$bulma-section-padding}*2 - #{$header-height} - #{$filter-height} - #{$filter-padding}*2);
$section-border-top : 0; //2px groove  lightgrey;
$section-padding:1.5rem;

.documents-view{
}


.header-section{
//    margin-bottom:$header-margin-bottom;
//    padding:0 $section-padding;
}


.filter-section{
    border-top:$section-border-top;
}

.result-section{
    height: $result-height;
}

.map-container{
    height: $result-height;
    position:relative;
}

.cards-container{
    max-height: $result-height;
    overflow: auto;
    padding-right:0;
}

.cards-list{
    margin:0;
}

.cards-list > div{
    padding:0;
    padding-right:0.5rem;
    padding-bottom:0.5rem;
    margin-bottom: 1rem;
}


.cards-container > div{
//    flex-flow:wrap row;
}


</style>
