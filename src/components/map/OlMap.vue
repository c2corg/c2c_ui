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
    import utils from "@/js/utils.js"

    import {mapLayers, dataLayers} from './MapLayers.js'
    import ol from './ol.js'

    const DEFAULT_EXTENT = [-400000, 5200000, 1200000, 6000000]
    const DEFAULT_POINT_ZOOM = 12

    const buildLineStyle = function(highlight) {

        return new ol.style.Style({
            //text: this.createTextStyle_(feature, type, highlight), todo
            stroke: new ol.style.Stroke({
                color: highlight ? 'red' : 'yellow',
                width: 3
            })
        })
    }

    const buildTextStyle = function(title, highlight){
    //createTextStyle_ = function(feature, type, highlight) {
        let text;

        if (highlight) { // on hover in list view
            text = new ol.style.Text({
                text: utils.stringDivider(title, 30, '\n'),
                textAlign: 'left',
                offsetX: 20,
                font: '12px verdana,sans-serif',
                stroke: new ol.style.Stroke({
                    color: 'white',
                    width: 3
                }),
                fill: new ol.style.Fill({
                    color: 'black'
                }),
                textBaseline: 'middle'
            });
        }

        return text;
    };

    const buildPointStyle = function(title, src, color, highlight){

        if( src === undefined)
            throw "Bad document type"

        var scale = highlight ? 0.55 : 0.4
        var imgSize = highlight ? 22 : 16;

        var iconStyle = new ol.style.Style({
            image: new ol.style.Icon({
                scale: scale,
                anchor: [0.5, 0.5],
                anchorXUnits: 'fraction',
                anchorYUnits: 'fraction',
                color: color,
                src: src,
            }),
            text: buildTextStyle(title, highlight)
        })

        var circleStyle = new ol.style.Style({
            image: new ol.style.Circle({
                radius: imgSize,
                fill: new ol.style.Fill({
                    color: 'rgba(255, 255, 255, 0.5)'
                }),
                stroke: new ol.style.Stroke({
                    color: '#ddd',
                    width: 2
                })
            })
        })

        return [circleStyle, iconStyle]
    }

    const getDocumentStyle = function(document, highlight, isLine){

        if(isLine){
            return buildLineStyle(highlight)
        }

        // todo : put style in a cache
        const type = document.type

        const urlByType = {
            i : require('@/assets/img/documents/images.svg'),
            o : require('@/assets/img/documents/outings.svg'),
            r : require('@/assets/img/documents/routes.svg'),
            u : require('@/assets/img/documents/profiles.svg'),
            x : require('@/assets/img/documents/xreports.svg'),
        }

        let color = '#FFAA45' // Usual icon orange

        if(document.condition_rating === 'excellent')
            color = '#008000';

        else if(document.condition_rating === 'good')
            color = '#9ACD32';

        else if(document.condition_rating === 'average')
            color = '#FFFF00';

        else if(document.condition_rating === 'poor')
            color = '#FF0000';

        else if(document.condition_rating === 'awful')
            color = '#8B0000';

        let title = utils.getDocumentTitle(document)

        if(type == "w")
            return buildPointStyle(
                title,
                require('@/assets/img/documents/waypoints/' + document.waypoint_type + '.svg'),
                color,
                highlight
            )

        if(type == "i" || type == "u" || type == "x" || type == "o" || type=="r")
            return buildPointStyle(title, urlByType[type], color, highlight)

    }

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

                documentsLayer : new ol.layer.Vector({
                    source: new ol.source.Vector()
                }),

                mapLayers : mapLayers,
                dataLayers : dataLayers,

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
                ]),

                layers: this.mapLayers.concat(this.dataLayers).concat([this.documentsLayer]),

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
            this.map.on('pointermove', this.onPointerMove);
            this.map.on('click', this.onClick);

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

                let feature = (new ol.format.GeoJSON()).readFeature(data)

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



<style lang="scss">

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

</style>
