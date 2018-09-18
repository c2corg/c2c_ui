<template>
    <div>
        <div ref="map" style="width:100%; height:100%" @click="showLayerSwitcher=false"/>

        <div ref="layerSwitcherButton" class="ol-control ol-control-layer-switcher-button">
            <button @click="showLayerSwitcher=!showLayerSwitcher">
                <fa-icon icon="layer-group"/>
            </button>
        </div>

        <div v-show="showLayerSwitcher" ref="layerSwitcher" class="ol-control ol-control-layer-switcher">
            <div>
                <header>
                    Base layer
                </header>
                <div v-for="layer of mapLayers" :key="layer.title" @click="visibleLayer=layer">
                    <input type="radio" :checked="layer==visibleLayer">
                    {{ layer.get('title') }}
                </div>
                <header>
                    Slopes
                </header>
                <div v-for="layer of dataLayers" :key="layer.title" @click="toogleMapLayer(layer)">
                    <input type="checkbox" :checked="layer.getVisible()">
                    {{ layer.get('title') }}
                </div>
            </div>
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
    import {defaults as defaultControls, Control, FullScreen} from 'ol/control';

    export default {

        props: {
            documents: {
                type: Array,
                required: true,
            },
            boundsBehavior: {
                type: Object,
                required: true,
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

                filterDocumentsWithMap: false,
            }
        },

        computed: {
            visibleLayer : {
                get(){
                    return this.mapLayers.find( layer => layer.getVisible()===true)
                },
                set(layer){
                    this.visibleLayer.setVisible(false)
                    layer.setVisible(true)
                }
            }
        },

        watch:{
            documents:{
                handler:['drawDocumentMarkers', 'fitMapToDocuments'],
                deep:true, // must look on change inside documents object
            },
        },

        mounted() {
            var this_ = this

            this.map = new Map({

                controls: defaultControls().extend([
                    new FullScreen({source: this.$el}),
                    new Control({element: this.$refs.layerSwitcherButton}),
                    new Control({element: this.$refs.layerSwitcher}),
                ]),

                layers: this.mapLayers.concat(this.dataLayers),
                view: new View({}),

                loadTilesWhileAnimating: true,
                loadTilesWhileInteracting: true,
                //pixelRatio: this.pixelRatio,
                //renderer: this.renderer,
                //keyboardEventTarget: this.keyboardEventTarget,
            })

            this.map.setTarget(this.$refs.map)
            this.documentsLayer.layer = this.addLayer(this.documentsLayer.markers)

            this.map.on("moveend", function(event) {
                var extent = event.map.getView().calculateExtent()
                this_.boundsBehavior.bounds = extent
            });

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

            buildMarker(document, layer){
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
                }


            },

            fitMapToDocuments(){

                if(this.documents.length==0 || this.boundsBehavior.bboxFilter)
                    return

                var extent = this.documentsLayer.layer.getSource().getExtent();
                this.map.getView().fit(extent, this.map.getSize());

            },

            toogleMapLayer(layer){
                layer.setVisible(!layer.getVisible())
            }
        }
    }
</script>


<style lang="scss" scoped>


@import '~ol/ol.css';

.ol-control-layer-switcher {
    bottom: 3em;
    left: .5em;

}
.ol-control-layer-switcher > div {
    color: white;
    text-decoration: none;
    background-color: rgba(0,60,136,0.5);
    border: none;
    border-radius: 2px;
    padding: 10px;

}

.ol-control-layer-switcher-button {
    bottom: .5em;
    left: .5em;
}

</style>
