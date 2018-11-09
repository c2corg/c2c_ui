<template>
    <div class="box">

        <div v-if="document.areas && document.areas.length" class="has-text-centered">

            <icon-area/>
            <span v-for="area of document.areas" :key="area.document_id" class="area-link">
                <document-link :document="area"/>&#0032;
            </span>

        </div>

        <map-view
            class="map-view"
            :documents="new Array(document)"
            :show-biodiv-sports-areas="['r', 'w'].includes(document.type)"
            :biodiv-sports-activities="document.activities"
            style="height:275px"/>

        <elevation-profile :document="document" />

        <div v-if="document.geometry.geom_detail" class="buttons is-centered">
            <button
                class="button is-primary"
                @click="downloadGpx">
                GPX
            </button>
            <button
                class="button is-primary"
                @click="downloadKml">
                KML
            </button>
        </div>
    </div>
</template>

<script>
    import utils from "@/js/utils"
    import ol from "@/libs/ol"

    import { requireDocumentProperty } from "@/js/propertiesMixins.js"
    import ElevationProfile from "./ElevationProfile"

    export default {
        components: {
            ElevationProfile,
        },

        mixins : [ requireDocumentProperty ],

        methods:{
            downloadKml(){
                this.downloadFeatures(
                    new ol.format.KML(),
                    '.kml',
                    'application/vnd.google-earth.kml+xml'
                )
            },

            downloadGpx(){
                this.downloadFeatures(
                    new ol.format.GPX(),
                    '.gpx',
                    'application/gpx+xml'
                )
            },

            downloadFeatures(format, extension, mimetype) {
                const geojson = new ol.format.GeoJSON()
                const features = geojson.readFeatures(this.document.geometry.geom_detail)

                if (features.length) {
                    // Export only the current document geometry, not the associated features
                    const feature = features[0]
                    const name = this.$documentUtils.getDocumentTitle(this.document, this.$route.params.lang)

                    feature.set('name', name)

                    const filename = this.document.document_id + extension
                    const content = format.writeFeatures([feature], {
                        featureProjection: 'EPSG:3857'
                    })

                    utils.download(content, filename, mimetype + ';charset=utf-8')
                }
            }
        }
    }
</script>

<style scoped>
    .map-view{
        margin-top:1rem;
        margin-bottom:1rem;
    }
</style>
