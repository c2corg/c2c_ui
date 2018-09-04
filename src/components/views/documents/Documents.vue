<template>
    <div class="section documents-view">
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

                    <a class="icon" @click="showFieldSelector()">
                        <i class="fas fa-filter"/>
                    </a>

                </span>
            </div>
        </div>

        <div>
            <query-items ref="queryItems"/>
        </div>

        <div class="columns">

            <div class="column cards-container" :class="{'is-hidden': !showResults}">

                <loading-notification :loaded="documents!=null" :error="error"/>

                <div v-if="documents" class="is-flex">
                        <document-card v-for="(document, index) in documents.documents"
                                      :key="index"
                                      :document="document"/>
                </div>
            </div>

            <div class="column map-container"
                 :class="{'is-5': showResults, 'is-hidden': !showMap}"
                 v-if="hasMap">

                <gmap-map ref="mapRef"
                          :street-view-control="false"
                          :center="{lat:10, lng:10}"
                          :zoom="7"
                          map-type-id="terrain"
                          style="width: 100%; height: 600px">
                    <gmap-marker v-for="(position, index) in positions"
                                :key="index"
                                :position="position"
                                :clickable="true"
                                :draggable="true"/>
                </gmap-map>

            </div>
        </div>


    </div>
</template>

<script>

    import c2c from '@/js/c2c.js'
    import utils from '@/js/utils.js'
    import constants from '@/js/constants.js'
    import mapUtils from '@/js/mapUtils.js'

    import DocumentCard from '@/components/cards/DocumentCard'
    import QueryItems from './QueryItems'

    export default {
        components: {
            QueryItems,
            DocumentCard,
        },

        data() {
            return {
                map: null,
                documents: null,
                error: null,
                showMap: true,
                showResults: true,

                positions: [],
                mapBounds: null,
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
                this.$refs.queryItems.initialize()
                this.loadElements();
            }
        },

        created() {
            this.loadElements();
        },

        methods:{
            showFieldSelector : function(){
                this.$refs.queryItems.showFieldSelector();
            },

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

                    if(this.hasMap){
                        this.positions=mapUtils.getPositions(this.documents.documents)
                        this.mapBounds=mapUtils.getBounds(this.documents.documents)

                        this.$refs.mapRef.$mapPromise.then((map) => {
                            mapUtils.fitBounds(map, this.mapBounds)
                        })
                    }
                })
                .catch(utils.getApiErrorHandler(this));
            }
        }
    }

</script>

<style scoped>

.cards-container > div{
    flex-flow:wrap row;
}

</style>
