<template>
    <div class="section documents-view">

        <div class="header-section">
            <div class="columns">
                <div class="column">
                    <div class="title is-1">
                        <icon-document :type="type"/>

                        {{title}}

                        <add-link :type="type">
                            <span class="icon">
                                <i class="fas fa-plus-circle"/>
                           </span>
                        </add-link>
                    </div>
                </div>

                <div class="column is-narrow">
                    <span>
                        <span class="icon" v-if="hasMap">
                            <i class="fas fa-list"
                               :class="{'has-text-primary':showResults}"
                               @click="showResults=!showResults" />
                       </span>

                        <span class="icon" v-if="hasMap">
                            <i class="fas fa-map-marked-alt"
                            :class="{'has-text-primary':showMap}"
                            @click="showMap=!showMap" />
                        </span>

                        <span v-if="documents" @click="loadElements()">
                            <span v-if="offset!==0">
                                {{offset + 1}} -
                            </span>
                            {{offset + documents.documents.length}} / {{documents.total}}
                        </span>

                    </span>
                </div>
            </div>
        </div>

        <div class="filter-section">
            <query-items/>
        </div>

        <div class="result-section">
            <div class="columns is-gapless">
                <div class="column cards-container" :class="{'is-hidden': !showResults}">

                    <loading-notification :loaded="documents!=null" :error="error"/>

                    <div v-if="documents" class="is-flex">
                            <document-card v-for="(document, index) in documents.documents" :key="index"
                                          :document="document"/>
                    </div>
                </div>

                <div class="column map-container"
                     :class="{'is-5': showResults, 'is-hidden': !showMap}"
                     v-if="hasMap">
                    <map-view :documents="documents" style="width: 100%; height: 100%">
                    </map-view>
                </div>
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


    export default {
        components: {
            QueryItems,
            DocumentCard,
        },

        data() {
            return {
                documents: null,
                error: null,
                showMap: true,
                showResults: true,
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
            offset(){
                return parseInt(this.$route.query.offset || 0)
            },
        },

        watch:{
            $route(){
                this.documents=null
                this.loadElements();
            }
        },

        created() {
            this.loadElements();
        },

        methods:{

            loadElements : function(){
                var offset = this.offset

                if(this.documents){
                    offset += this.documents.documents.length
                }

                var query = Object.assign({offset : offset ? offset : undefined}, this.$route.query)

                c2c[this.$route.name].get(query)
                .then(response => {

                    if(this.documents){
                        for(let document of response.data.documents){
                            this.documents.documents.push(document)
                        }
                    } else {
                        this.documents=response.data;
                    }
                })
                .catch(utils.getApiErrorHandler(this));
            }
        }
    }
</script>

<style scoped lang="scss">

@import '@/assets/sass/main.scss';

$bulma-section-padding : 3rem; // from 3rem 1.5rem
$header-height : 78px;
$filter-height : 60px;
$result-height : calc(100vh - #{$navbar-height} - #{$bulma-section-padding}*2 - #{$header-height} - #{$filter-height});

.documents-view{
}

.header-section{
}


.filter-section{
//    background: pink;
    height:$filter-height;
}

.result-section{
//    background: orange;
    max-height: $result-height;
}

.map-container{
    max-height: $result-height;
    min-height: 400px;
    position:relative;
}

.cards-container{
    max-height: $result-height;
    overflow: auto;
}

.cards-container > div{
    flex-flow:wrap row;
}

</style>
