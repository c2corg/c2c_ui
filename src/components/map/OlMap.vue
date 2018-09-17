<template>
    <div>
        <slot/>
    </div>
</template>


<script>
    require('ol/ol.css')

    import {Map, View, Feature} from 'ol';
    import TileLayer from 'ol/layer/Tile';
    import OSM from 'ol/source/OSM';
    import XYZ from 'ol/source/XYZ';
    import Point from 'ol/geom/Point';
    import VectorSource from 'ol/source/Vector';
    import VectorLayer from 'ol/layer/Vector';
    import Collection from 'ol/Collection';
    import {defaults as defaultControls, FullScreen} from 'ol/control';

    export default {

        props: {
            documents: {
                type: Array,
                required: true,
            }
        },

        data(){
            return {
                map: null,
                view_ : null,
                map_ : null,
                documentsLayer : {
                    layer:null,
                    markers : new Collection()
                }
            }
        },

        watch:{
            documents:{
                handler:'fitMapToDocuments',
                deep:true, // must look on change inside documents object
            },
            document: 'fitMapToDocuments',
        },

        mounted() {
            this.map = this.createOlObject()

            //hasMap(this)
            this.map.setTarget(this.$el)
        //    this.subscribeAll()
        //    this.updateSize()
        },

        methods : {
            createOlObject () {

                this.map_ = new Map({

                    controls: defaultControls().extend([
                        new FullScreen({
                            source: this.$el
                        })
                    ]),

                    layers: [
                        new TileLayer({
                            source: new OSM()
                        }),

                        new TileLayer({
                            title: 'OSM',
                            type: 'base',
                            visible: true,
                            source: new XYZ({
                                url: '//{a-c}.tile.opentopomap.org/{z}/{x}/{y}.png'
                            })
                        })
                    ],
                    view: new View({}),

                    //loadTilesWhileAnimating: this.loadTilesWhileAnimating,
                    //loadTilesWhileInteracting: this.loadTilesWhileInteracting,
                    //pixelRatio: this.pixelRatio,
                    //renderer: this.renderer,
                    //logo: this.logo,
                    //keyboardEventTarget: this.keyboardEventTarget,
                    //view: this._view,
                })

                this.view_ = this.map_.getView()
                this.documentsLayer.layer = this.addLayer(this.documentsLayer.markers)

                this.fitMapToDocuments()
                return this.map_
            },

            addLayer(features){
                var layer = new VectorLayer({
                    source: new VectorSource({
                      features: features
                    }),
                })

                this.map_.addLayer(layer)

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

            fitMapToDocuments(){
                this.documentsLayer.markers.clear()

                for(let document of this.documents){
                    this.buildMarker(document, this.documentsLayer)
                }

                if(this.documents.length==0)
                    return

                var extent = this.documentsLayer.layer.getSource().getExtent();
                this.map_.getView().fit(extent, this.map_.getSize());

            }
        }
    }
</script>
