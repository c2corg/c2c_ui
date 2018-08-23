<template>
    <div class="section content documents-view">

        <h1>
            <icon-document :type="type"/>
            {{title}}
            <span class="is-pulled-right">
                <add-link :type="type">
                    <span class="icon is-medium">
                        <i class="fas fa-plus-circle"/>
                   </span>
                </add-link>
                <span class="icon is-medium" v-if="hasMap">
                    <i class="fas fa-list"
                       :class="{'has-text-primary':showResults}"
                       @click="showResults=!showResults" />
               </span>
               <span class="icon is-medium" v-if="hasMap">
                    <i class="fas fa-map-marked-alt"
                       :class="{'has-text-primary':showMap}"
                       @click="showMap=!showMap" />
                </span>
            </span>
        </h1>

        <loading-notification :loaded="documents!=null" class="column"/>

        <div class="columns">
            <div class="column cards-container" :class="{'is-hidden': !showResults}">
                <div v-if="documents" class="is-flex">
                        <document-card v-for="document in documents.documents"
                                      :key="document.document_id"
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
    import constants from '@/js/constants.js'
    import mapUtils from '@/js/mapUtils.js'

    import DocumentCard from '@/components/cards/DocumentCard'

    export default {
        components: {
            DocumentCard,
        },

        data() {
            return {
                map: null,
                documents: null,
                title: this.$route.name,
                type: this.$route.name.slice(0, -1),
                hasMap: constants.documentsGeoLocalization.includes(this.$route.name),
                showMap: true,
                showResults: true,

                positions: [],
                mapBounds: null
            }
        },

        created() {
            c2c[this.$route.name].get(this.$route.query).then(response => {
                this.documents=response.data;
                if(this.hasMap){
                    this.positions=mapUtils.getPositions(this.documents.documents)
                    this.mapBounds=mapUtils.getBounds(this.documents.documents)

                    this.$refs.mapRef.$mapPromise.then((map) => {
                        mapUtils.fitBounds(map, this.mapBounds)
                    })
                }
            });
        },
    }

</script>

<style scoped>

.cards-container > div{
    flex-flow:wrap row;
    justify-content:center;
    margin:auto;
}

</style>
