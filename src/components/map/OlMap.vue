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
                                <input type="radio" :checked="layer==visibleLayer">
                                {{ layer.get('title') }}
                            </div>
                        </td>
                        <td>
                            <header>Slopes</header>
                            <div v-for="layer of dataLayers" :key="layer.title" @click="toogleMapLayer(layer)">
                                <input type="checkbox" :checked="layer.getVisible()">
                                {{ layer.get('title') }}
                            </div>
                        </td>
                    </tr>
                </table>
            </div>
        </div>

        <div v-show="showFilterControl" ref="useMapAsFilter" class="ol-control ol-control-use-map-as-filter">
            <button @click="filterDocumentsWithMap=!filterDocumentsWithMap">
                <fa-icon :icon="filterDocumentsWithMap ? 'check-square' : 'square'" size="xs"/>
                Search when I move map
            </button>
        </div>
    </div>
</template>


<script>

    import {mapLayers, dataLayers} from './MapLayers.js'

    import {Map, View, Feature } from 'ol';
    import Point from 'ol/geom/Point';
    import VectorSource from 'ol/source/Vector';
    import VectorLayer from 'ol/layer/Vector';
    import Collection from 'ol/Collection';
    import GeoJSON from 'ol/format/GeoJSON';
    import {defaults as defaultControls, Control, FullScreen} from 'ol/control';

    export default {

        props: {
            documents: {
                type: Array,
                required: true,
            },

            showFilterControl: {
                type: Boolean,
                required: false,
            }
        },

        data(){
            return {
                map: null,

                documentsLayer : {
                    layer:null,
                    markers : new Collection()
                },

                mapLayers : mapLayers,
                dataLayers : dataLayers,

                showLayerSwitcher: false,

                filterDocumentsWithMap: this.$route.query.bbox !== undefined && false,
            }
        },

        computed: {

            urlValue:{
                get(){
                    var result = this.$route.query.bbox
                    return result ? result.replace("%252C", ",").split(",").map(parseInt) : undefined
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

            this.map = new Map({
                target : this.$refs.map,

                controls: defaultControls().extend([
                    new FullScreen({source: this.$el}),
                    new Control({element: this.$refs.layerSwitcherButton}),
                    new Control({element: this.$refs.layerSwitcher}),
                    new Control({element: this.$refs.useMapAsFilter}),
                ]),

                layers: this.mapLayers.concat(this.dataLayers),

                view: new View({
                    maxZoom:this.visibleLayer.get("maxZoom")
                }),

                loadTilesWhileAnimating: true,
                loadTilesWhileInteracting: true,
                //pixelRatio: this.pixelRatio,
                //renderer: this.renderer,
                //keyboardEventTarget: this.keyboardEventTarget,
            })

            this.documentsLayer.layer = this.addLayer(this.documentsLayer.markers)

            this.map.on("moveend", this.sendBoundsToUrl);

            this.drawDocumentMarkers()
            this.fitMapToDocuments()

            //hasMap(this)
        //    this.subscribeAll()
        //    this.updateSize()
        },

        methods : {

            addLayer(features){
                var layer = new VectorLayer({
                    source: new VectorSource({
                      features: features
                    }),
                })

                this.map.addLayer(layer)

                return layer
            },

            setMaxZoom(){
                const maxZoom = this.visibleLayer.get("maxZoom")

                if(this.view.getZoom() > maxZoom){
                    this.view.setZoom(maxZoom)
                }
                
                this.view.set("maxZoom", maxZoom)


            },

            buildMarker(document, layer){
                if(!document.geometry.geom)
                    return

                var point_3785 = JSON.parse(document.geometry.geom).coordinates

                var marker = new Feature({
                    geometry: new Point(point_3785),
                });

                layer.markers.push(marker)

                return marker;
            },

            drawDocumentMarkers(){

                this.documentsLayer.markers.clear()

                for(let document of this.documents){
                    this.buildMarker(document, this.documentsLayer)

                    if(document.geometry.geom_detail){
                        let geom_detail = JSON.parse(document.geometry.geom_detail)

                        let features = (new GeoJSON()).readFeature(geom_detail)

                        this.documentsLayer.markers.push(features)

                    }
                }
            },

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

                var extent = this.documentsLayer.layer.getSource().getExtent();
                this.view.fit(extent, this.map.getSize());
                this.view.setZoom(Math.min(14, this.view.getZoom()))
            },

            toogleMapLayer(layer){
                layer.setVisible(!layer.getVisible())
            }
        }
    }
</script>


<style lang="scss" scoped>

@import '~ol/ol.css';

$control-margin:0.5em;

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


.ol-control-layer-switcher > div {
    color: white;
    text-decoration: none;
    background-color: rgba(0,60,136,0.5);
    border: none;
    border-radius: 2px;
    padding: 10px;
}

.ol-control-use-map-as-filter > button{
    width: auto;
    padding-left: 0.5em;
    padding-right: 0.5em;
    font-weight:normal;
    /*
    color: white;
    background-color: rgba(0,60,136,0.5);
    border-radius: 2px;
    margin:1px;
    height: 30px;
    */
}


</style>
