<template>
    <div style="width: 100%; height: 100%">
        <div ref="map" style="width:100%; height:100%" @click="showLayerSwitcher=false"/>

        <div ref="layerSwitcherButton" class="ol-control ol-control-layer-switcher-button">
            <button @click="showLayerSwitcher=!showLayerSwitcher">
                <fa-icon icon="layer-group"/>
            </button>
        </div>

        <div v-show="showLayerSwitcher" ref="layerSwitcher" class="ol-control ol-control-layer-switcher">
            <div>
                <table>
                    <tr>
                        <td>
                            <header>Base layer</header>
                            <div v-for="layer of mapLayers" :key="layer.title" @click="visibleLayer=layer">
                                <input :checked="layer==visibleLayer" type="radio">
                                {{ layer.get('title') }}
                            </div>
                        </td>
                        <td>
                            <header>Slopes</header>
                            <div v-for="layer of dataLayers" :key="layer.title" @click="toogleMapLayer(layer)">
                                <input :checked="layer.getVisible()" type="checkbox">
                                {{ layer.get('title') }}
                            </div>
                        </td>
                    </tr>
                </table>
            </div>
        </div>

        <div
            v-show="showFilterControl"
            ref="useMapAsFilter"
            class="ol-control ol-control-use-map-as-filter"
            v-tooltip:right="'Search when map moves'">
            <button @click="filterDocumentsWithMap=!filterDocumentsWithMap">
                <fa-icon :class="{'has-text-success':filterDocumentsWithMap}" icon="search"/>
            </button>
        </div>

        <div
            v-show="showCenterOnGeolocation"
            ref="centerOnGeolocation"
            class="ol-control ol-control-center-on-geolocation">
            <button @click="centerOnGeolocation">
                <fa-icon icon="bullseye"/>
            </button>
        </div>

    </div>
</template>


<script>
    import ol from '@/js/ol.js'

    import {mapLayers, dataLayers} from './MapLayers.js'
    import biodivSports from './biodivSports.js'
    import { getDocumentStyle, geoJSONFormat } from './mapUtils.js'

    const DEFAULT_EXTENT = [-400000, 5200000, 1200000, 6000000]
    const DEFAULT_POINT_ZOOM = 12


    export default {

        props: {
            documents: {
                type: Array,
                required: true,
            },

            showFilterControl: {
                type: Boolean,
                required: false,
                default:false,
            },

            showCenterOnGeolocation: {
                type: Boolean,
                required: false,
                default:false,
            },

            showBiodivSportsAreas: {
                type: Boolean,
                required: false,
                default:false,
            },

            biodivSportsActivities: {
                type: Array,
                default: null,
            }
        },

        data(){
            return {
                map: null,

                // map layers, one of them is visible
                mapLayers : mapLayers,

                //slope layers
                dataLayers : dataLayers,

                //bidiv layer
                biodivLayer : new ol.layer.Vector({
                    source: new ol.source.Vector()
                }),

                // layer for document icons and paths
                documentsLayer : new ol.layer.Vector({
                    source: new ol.source.Vector()
                }),

                geolocation : null,

                showLayerSwitcher: false,

                filterDocumentsWithMap: this.$route.query.bbox !== undefined,

                highlightedFeature : null,
            }
        },

        computed: {

            highlightedDocument:{
                get(){
                    if(this.highlightedFeature)
                        return this.highlightedFeature.get('document')

                },
                set(document){
                    if(this.highlightedFeature)
                        this.highlightedFeature.setStyle(this.highlightedFeature.get("normalStyle"))

                    if(document){
                        this.highlightedFeature = this.documentsLayer.getSource().getFeatureById(document.document_id)

                        if(this.highlightedFeature && this.highlightedFeature.get("highlightedStyle")){
                            this.highlightedFeature.setStyle(this.highlightedFeature.get("highlightedStyle"))
                        }
                    }
                }
            },

            urlValue:{
                get(){
                    var result = this.$route.query.bbox
                    return result ? result.replace("%252C", ",").split(",").map(num => parseInt(num, 10)) : undefined
                },
            },

            view(){
                return this.map.getView()
            },

            visibleLayer : {
                get(){
                    return this.mapLayers.find( layer => layer.getVisible()===true)
                },
                set(layer){
                    this.visibleLayer.setVisible(false)
                    layer.setVisible(true)
                    this.setMaxZoom()
                }
            },
        },

        watch:{
            documents:{
                handler:function(){
                    this.drawDocumentMarkers()
                    this.fitMapToDocuments()
                },
                deep:true, // must look on change inside documents object
            },

            filterDocumentsWithMap : 'sendBoundsToUrl',
        },

        mounted() {

            this.map = new ol.Map({
                target : this.$refs.map,

                controls: ol.control.defaults().extend([
                    new ol.control.FullScreen({source: this.$el}),
                    new ol.control.ScaleLine(),
                    new ol.control.Control({element: this.$refs.layerSwitcherButton}),
                    new ol.control.Control({element: this.$refs.layerSwitcher}),
                    new ol.control.Control({element: this.$refs.useMapAsFilter}),
                    new ol.control.Control({element: this.$refs.centerOnGeolocation}),
                ]),

                layers: this.mapLayers.concat(this.dataLayers).concat([this.biodivLayer, this.documentsLayer]),

                view: new ol.View({
                    maxZoom:this.visibleLayer.get("maxZoom"),
                }),

                loadTilesWhileAnimating: true,
                loadTilesWhileInteracting: true,


                //pixelRatio: this.pixelRatio,
                //renderer: this.renderer,
                //keyboardEventTarget: this.keyboardEventTarget,
            })

            this.map.on("moveend", this.sendBoundsToUrl);
            this.map.on("moveend", this.getBiodivSportsAreas);
            this.map.on('pointermove', this.onPointerMove);
            this.map.on('click', this.onClick);


            this.geolocation = new ol.Geolocation({
                projection: this.view.getProjection()
            })

            this.drawDocumentMarkers()

            if(this.urlValue)
                this.view.fit(this.urlValue, this.map.getSize())
            else
                this.fitMapToDocuments()

        },

        methods : {

            setMaxZoom(){
                const maxZoom = this.visibleLayer.get("maxZoom")

                if(this.view.getZoom() > maxZoom){
                    this.view.setZoom(maxZoom)
                }

                this.view.set("maxZoom", maxZoom)
            },


            addDocumentFeature(document, data, isLine, source){

                let feature = geoJSONFormat.readFeature(data)

                feature.set("normalStyle", getDocumentStyle(document, false, isLine))
                feature.set("highlightedStyle", getDocumentStyle(document, true, isLine))
                feature.setStyle(feature.get('normalStyle'));

                feature.set("document", document)
                feature.setId(document.document_id)

                source.addFeature(feature)
            },

            drawDocumentMarkers(){
                var source = this.documentsLayer.getSource()
                source.clear()

                for(let document of this.documents){
                    if(document.geometry){
                        // do not display both line and point
                        if(document.geometry.geom_detail){
                            this.addDocumentFeature(document, document.geometry.geom_detail, true, source)
                        }
                        else if(document.geometry.geom){
                            this.addDocumentFeature(document, document.geometry.geom, false, source, false)
                        }
                    }
                }
            },

            // If user want's to filter with map, it will send extent to url
            // otherwise, it set bbox url to undefined
            sendBoundsToUrl(){

                var bounds = this.view.calculateExtent()
                var query = Object.assign({}, this.$route.query)

                query.bbox =  this.filterDocumentsWithMap ? bounds.map(Math.round).join(",") : undefined
                if(query.bbox!==this.$route.query.bbox){
                    this.$router.push({query: query})
                }
            },

            fitMapToDocuments(){

                if(this.documents.length==0 || this.filterDocumentsWithMap)
                    return

                var extent = this.documentsLayer.getSource().getExtent();

                if(extent.filter(isFinite).length != 4) // if there is inifnity, default extent
                    extent =  DEFAULT_EXTENT

                this.view.fit(extent, this.map.getSize());
                this.view.setZoom(Math.min(DEFAULT_POINT_ZOOM, this.view.getZoom()))
            },

            toogleMapLayer(layer){
                layer.setVisible(!layer.getVisible())
            },

            onPointerMove(event) {
                var this_ = this

                this.highlightedDocument = null

                this.map.forEachFeatureAtPixel(event.pixel, function (feature) {
                    if(feature.get('document')){
                        this_.highlightedDocument = feature.get('document')
                        return true
                    }
                })
            },

            onClick(event){
                const feature = this.map.forEachFeatureAtPixel(event.pixel, feature => feature)

                if (feature) {
                    const document = feature.get('document');
                    if(document){
                        this.$router.push({
                            name: document.type, params: {
                                id:document.document_id,
                            }
                        })
                    }
                }
            },

            centerOnGeolocation(){
                var position = this.geolocation.getPosition()

                if(!position)
                    return

                this.view.setCenter(position);
            },

            getBiodivSportsAreas(){
                if (!this.showBiodivSportsAreas)
                    return

                let extent = this.view.calculateExtent(this.map.getSize() || null)

                // get extent in WGS format
                extent = ol.proj.transformExtent(extent, ol.proj.get('EPSG:3857'), ol.proj.get('EPSG:4326'))
                biodivSports.fetchData(extent, this.biodivSportsActivities, this.$language.current).then(
                    this.addBiodivSportsData
                )
            },

            addBiodivSportsData(response) {
                //eslint-disable-next-line
                console.log(this, "is vue component???")

                const results = response['data']['results']
                const source = this.biodivLayer.getSource()

                this.hasBiodivsportAreas = false

                for (let result of results) {

                    let geometry = geoJSONFormat.readGeometry(result['geometry'], {
                        dataProjection: 'EPSG:4326',
                        featureProjection: 'EPSG:3857'
                    });

                    const feature = new ol.Feature({
                        geometry,
                        'id': (result['id']),
                        'source': 'biodivsports',
                        'title': (result['name']),
                        'description': (result['description']),
                        'info_url': (result['info_url']),
                        'kml_url': (result['kml_url']),
                        'period': (result['period']),
                    });

                    feature.setId('biodiv_' + (result['id']));
                    source.addFeature(feature);
                    this.hasBiodivsportAreas = true
                }
            }
        }
    }
</script>

<style lang="scss" scoped>

@import '~ol/ol.css';

$control-margin:0.5em;

.ol-control-center-on-geolocation{
    top: 100px;
    left: $control-margin;
}

.ol-control-layer-switcher {
    bottom: 3em;
    left: $control-margin;

}

.ol-control-layer-switcher-button {
    bottom: $control-margin;
    left: $control-margin;
}

.ol-control-use-map-as-filter{
    top: $control-margin;
    left:3em;
}

//style on layers popup
.ol-control-layer-switcher > div {
    color: white;
    text-decoration: none;
    background-color: rgba(0,60,136,0.5);
    border: none;
    border-radius: 2px;
    padding: 10px;
}

</style>



<style lang="scss">

$control-margin:0.5em;

.ol-scale-line {
        background: rgba(255, 255, 255, 0.3);
        bottom: 10px;
        right: 40px;
        left: initial;

    .ol-scale-line-inner {
        color: black;
        border: 1px solid black;
        border-top: none;
    }
}

.ol-full-screen{
    right:auto;
    left:$control-margin;
    top: 60px;
}

</style>
