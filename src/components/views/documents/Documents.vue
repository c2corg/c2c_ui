<template>
    <div class="section documents-view">
        <div class="level is-mobile header-section">
            <div class="level-left">
                <span class="level-item">
                    <span class="title is-1 is-first-letter-uppercase">{{ title }}</span>
                </span>
            </div>
            <div class="level-right">
                <span class="level-item">
                    <add-link :type="type" class="button is-rounded is-primary">
                        Add a {{ type }}
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
                    <span v-if="hasMap" class="icon is-size-3">
                        <fa-icon :class="{'has-text-primary':showMap}"
                                 icon="map-marked-alt"
                                 @click="showMap=!showMap" />
                    </span>
                </div>
            </div>
        </div>

        <div class="columns">
            <div :class="{'is-12': !showMap, 'is-8': showMap}"
                 class="column cards-container">

                <loading-notification :loaded="documents!=null" :error="error"/>

                <div v-if="documents" class="columns is-multiline cards-list">
                    <div v-for="(document, index) in documents.documents" :key="index" :class="{'is-one-third':showMap, 'is-one-fifth':!showMap}"
                         class="column card-container">
                        <document-card :document="document"/>
                    </div>
                </div>

                <page-selector v-if="documents!=null" :documents="documents"/>
            </div>

            <div v-if="hasMap"
                 class="column map-container">
                <map-view :documents="documents" style="width: 100%; height: 100%"/>
            </div>
        </div>
    </div>
</template>

<script>

    import c2c from '@/js/c2c.js'
    import utils from '@/js/utils.js'
    import constants from '@/js/constants.js'

    import QueryItems from './QueryItems'
    import PageSelector from './PageSelector'

    export default {
        components: {
            QueryItems,
            PageSelector,
        },

        data() {
            return {
                documents: null,
                error: null,
                showMap: null,
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
            $route : 'loadElements',
        },

        created() {
            this.showMap = this.hasMap;
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
