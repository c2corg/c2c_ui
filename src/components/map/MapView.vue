<template>
    <gmap-map  class="map-component" ref="googleMapRef"
              :street-view-control="false"
              :center="{lat:10, lng:10}"
              style="min-height: 300px"
              map-type-id="terrain">

        <gmap-marker v-for="(position, index) in positions" :key="index"
                    :position="position"
                    :clickable="true"
                    :draggable="true"/>
    </gmap-map>
</template>

<script>
    import Vue from 'vue'
    import mapUtils from '@/js/mapUtils.js'

    import * as VueGoogleMaps from 'vue2-google-maps'

    Vue.use(VueGoogleMaps, {
        load: {
        key: 'AIzaSyAYiZ3lDd0WNJIOEWLO_y2tJHTmWmZG6oY',
            libraries: 'places', // This is required if you use the Autocomplete plugin
            // OR: libraries: 'places,drawing'
            // OR: libraries: 'places,drawing,visualization'
            // (as you require)

            //// If you want to set the version, you can do so:
            // v: '3.26',
        }

        //// If you intend to programmatically custom event listener code
        //// (e.g. `this.$refs.gmap.$on('zoom_changed', someFunc)`)
        //// instead of going through Vue templates (e.g. `<GmapMap @zoom_changed="someFunc">`)
        //// you might need to turn this on.
        // autobindAllEvents: false,

        //// If you want to manually install components, e.g.
        //// import {GmapMarker} from 'vue2-google-maps/src/components/marker'
        //// Vue.component('GmapMarker', GmapMarker)
        //// then disable the following:
        // installComponents: true,
    })


    export default {

        props:["documents", "document"],

        data(){
            return {
                layer:"google-map",
                positions:[],
            }
        },

        computed:{
            documents_(){
                if(this.documents)
                    return this.documents.documents

                if(this.document)
                    return [this.document]

                return []
            },
        },

        mounted(){
            this.computePositions()
            this.fitBounds()
        },

        watch:{
            documents:{
                handler:'fitMapToDocuments',
                deep:true, // must look on change inside documents object
            },
            document: 'fitMapToDocuments',
        },

        methods:{
            fitMapToDocuments(){
                this.computePositions()
                this.fitBounds()
            },

            execute_(callback){
                this.$gmapApiPromiseLazy().then(() => {
                    this.$refs.googleMapRef.$mapPromise.then(callback)
                })
            },

            fitBounds(){
                this.execute_((map) => {
                    var bounds = new window.google.maps.LatLngBounds()

                    this.documents_.forEach(document => {
                        bounds.extend(mapUtils.getDocumentLatLng(document))
                    })

                    map.fitBounds(bounds)
                    map.setZoom(Math.min(13, map.zoom ? map.zoom : 13))
                })
            },

            computePositions(){
                this.execute_(() => {
                    this.positions = mapUtils.getPositions(this.documents_)
                })
            },
        }
    }

</script>

<style scoped>
.map-component{
    min-height:300px;
}
</style>
