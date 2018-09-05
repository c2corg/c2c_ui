<template>
    <div>
        <gmap-map ref="googleMapRef" v-if="layer==='google-map'"
                  :street-view-control="false"
                  :center="{lat:10, lng:10}"
                  :zoom="7"
                  style="width: 100%; height: 600px"
                  map-type-id="terrain">

            <gmap-marker v-for="(position, index) in positions"
                        :key="index"
                        :position="position"
                        :clickable="true"
                        :draggable="true"/>
        </gmap-map>
    </div>
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

//    console.log(VueGoogleMaps, l)

    export default {

        props:["documents"],

        data(){
            return {
                layer:"google-map"
            }
        },

        computed:{
            positions(){
                return this.documents ? mapUtils.getPositions(this.documents.documents) : []
            },

            bounds(){
                return this.documents ? mapUtils.getBounds(this.documents.documents) : new window.google.maps.LatLngBounds()
            }
        },

        watch:{
            documents(){
                this.$refs.googleMapRef.$mapPromise.then((map) => {
                    mapUtils.fitBounds(map, this.bounds)
                })
            }
        }
    }

</script>
