<template>
    <!-- TODO on route view, map in full screen has not a full height -->
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
                            <header v-translate>Base layer</header>
                            <div v-for="layer of mapLayers" :key="layer.title" @click="visibleLayer=layer">
                                <input :checked="layer==visibleLayer" type="radio">
                                {{ layer.get('title') }}
                            </div>
                        </td>
                        <td>
                            <header v-translate>Slopes</header>
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
            class="ol-control ol-control-use-map-as-filter">
            <button
                @click="filterDocumentsWithMap=!filterDocumentsWithMap"
                :class="{'has-text-success':filterDocumentsWithMap}">
                <fa-icon icon="search"/>
                <span v-translate>Filter on map extent</span>
            </button>
        </div>

        <div
            v-show="showCenterOnGeolocation"
            ref="centerOnGeolocation"
            :title="$gettext('Recenter on your current position')"
            class="ol-control ol-control-center-on-geolocation">
            <button @click="centerOnGeolocation">
                <fa-icon icon="bullseye"/>
            </button>
        </div>

        <div
            v-show="showRecenterOn"
            ref="recenterOnControl"
            class="ol-control ol-control-recenter-on">
            <input type="text" :placeholder="$gettext('Recenter on...')" @input="searchRecenterPropositions">
        </div>

        <div
            v-show="showRecenterOnPropositions"
            ref="recenterOnPropositions"
            class="ol-control ol-control-recenter-on-propositions">
            <ul v-if="recenterPropositions && recenterPropositions.data && recenterPropositions.data.features">
                <li v-for="(item, i) of recenterPropositions.data.features" :key="i" @click="recenterOn(item)">
                    {{ item.properties.name }},
                    <small>{{ item.properties.state }}, {{ item.properties.country }}</small>
                </li>
            </ul>
        </div>

        <div
            v-show="editable"
            ref="resetGeometry"
            class="ol-control ol-control-reset-geometry">
            <button @click="resetGeometry" v-translate>
                Reset geometry
            </button>
        </div>

        <div
            v-show="editable"
            ref="clearGeometry"
            class="ol-control ol-control-clear-geometry">
            <button @click="clearGeometry" v-translate>
                Clear
            </button>
        </div>

        <biodiv-information ref="BiodivInformation" :data="biodivData"/>
        <swiss-protection-area-information ref="SwissProtectionAreaInformation" :data="swissProtectionAreaData"/>
    </div>
</template>

<script>
    import ol from '@/js/libs/ol'
    import biodivSportsService from '@/js/apis/BiodivSportsService'
    import photon from '@/js/apis/photon'
    import respecterCestProtegerService from '@/js/apis/RespecterCestProtegerService'

    import { cartoLayers, dataLayers } from './mapLayers.js'
    import {
        getDocumentPointStyle,
        getDocumentLineStyle,
        geoJSONFormat,
        buildPolygonStyle,
        buildDiffStyle
    } from './mapUtils.js'

    import BiodivInformation from './BiodivInformation'
    import SwissProtectionAreaInformation from './SwissProtectionAreaInformation'

    const DEFAULT_EXTENT = [-400000, 5200000, 1200000, 6000000]
    const DEFAULT_POINT_ZOOM = 12

    export default {

        components: {
            BiodivInformation,
            SwissProtectionAreaInformation
        },

        props: {
            documents: {
                type: Array,
                default: null
            },

            showFilterControl: {
                type: Boolean,
                default: false
            },

            showRecenterOn: {
                type: Boolean,
                default: false
            },

            showCenterOnGeolocation: {
                type: Boolean,
                default: false
            },

            showProtectionAreas: {
                type: Boolean,
                default: false
            },

            biodivSportsActivities: {
                type: Array,
                default: null
            },

            geomDetailEditable: {
                type: Boolean,
                default: false
            },

            editedDocument: {
                type: Object,
                default: null
            },

            oldDocument: {
                type: Object,
                default: null
            },

            newDocument: {
                type: Object,
                default: null
            },

            highlightedDocument: {
                type: Object,
                default: null
            }
        },

        data() {
            return {
                map: null,

                // map layers, one of them is visible
                mapLayers: cartoLayers,

                // slope layers
                dataLayers: dataLayers,

                // protection areas layer
                protectionAreasLayer: new ol.layer.Vector({
                    source: new ol.source.Vector()
                }),

                // layer for document icons and paths
                documentsLayer: new ol.layer.Vector({
                    source: new ol.source.Vector()
                }),

                // layer for associated waypoints
                waypointsLayer: new ol.layer.Vector({
                    source: new ol.source.Vector()
                }),

                geolocation: null,

                showLayerSwitcher: false,

                filterDocumentsWithMap: Boolean(this.$route.query.bbox),

                recenterPropositions: null,
                showRecenterOnPropositions: false,

                biodivData: {},
                swissProtectionAreaData: {},

                // on editable mode, there a button reset
                // we must save initial geometry
                initialGeometry: null,

                highlightedFeature: null
            }
        },

        computed: {

            editable() {
                return this.editedDocument !== null
            },

            urlValue: {
                get() {
                    var result = this.$route.query.bbox
                    return result ? result.replace('%252C', ',').split(',').map(num => parseInt(num, 10)) : undefined
                }
            },

            view() {
                return this.map.getView()
            },

            visibleLayer: {
                get() {
                    return this.mapLayers.find(layer => layer.getVisible() === true)
                },
                set(layer) {
                    this.visibleLayer.setVisible(false)
                    layer.setVisible(true)
                    this.setMaxZoom()
                }
            }
        },

        watch: {
            documents: {
                handler: function() {
                    this.drawDocumentMarkers()
                    this.fitMapToDocuments()
                }
            },

            editedDocument: {
                handler: function() {
                    this.drawDocumentMarkers()
                    this.fitMapToDocuments()

                    // when route is set on outing edition, geom may be updated
                    this.setDrawInteraction()
                },
                deep: true // must look on change inside documents object
            },

            filterDocumentsWithMap: 'sendBoundsToUrl',

            highlightedDocument(newValue, oldValue) {
                if (this.highlightedDocument) {
                    this.setHighlightedFeature(this.documentsLayer.getSource().getFeatureById(this.highlightedDocument.document_id))
                } else {
                    this.setHighlightedFeature(null)
                }
            }
        },

        mounted() {
            this.map = new ol.Map({
                target: this.$refs.map,

                controls: [
                    new ol.control.Zoom(),
                    new ol.control.FullScreen({ source: this.$el }),
                    new ol.control.ScaleLine(),
                    new ol.control.Control({ element: this.$refs.layerSwitcherButton }),
                    new ol.control.Control({ element: this.$refs.layerSwitcher }),
                    new ol.control.Control({ element: this.$refs.useMapAsFilter }),
                    new ol.control.Control({ element: this.$refs.centerOnGeolocation }),
                    new ol.control.Control({ element: this.$refs.recenterOnControl }),
                    new ol.control.Control({ element: this.$refs.recenterOnPropositions }),
                    new ol.control.Control({ element: this.$refs.resetGeometry }),
                    new ol.control.Control({ element: this.$refs.clearGeometry }),
                    new ol.control.Attribution()
                ],

                layers: this.mapLayers.concat(this.dataLayers).concat([
                    this.protectionAreasLayer,
                    this.waypointsLayer,
                    this.documentsLayer
                ]),

                view: new ol.View({
                    maxZoom: this.visibleLayer.get('maxZoom')
                }),

                loadTilesWhileAnimating: true,
                loadTilesWhileInteracting: true

            // pixelRatio: this.pixelRatio,
            // renderer: this.renderer,
            // keyboardEventTarget: this.keyboardEventTarget,
            })

            this.map.on('moveend', this.sendBoundsToUrl)
            this.map.on('moveend', this.getProtectionAreas)
            if (this.showProtectionAreas && !this.editable) {
                this.dataLayers
                    .filter(layer => layer.getProperties().isProtectionLayer)
                    .forEach(layer => layer.setVisible(true));
            }

            this.geolocation = new ol.Geolocation({
                trackingOptions: {
                    enableHighAccuracy: true
                },

                projection: this.view.getProjection()
            })

            this.drawDocumentMarkers()

            if (this.urlValue) {
                this.view.fit(this.urlValue, { size: this.map.getSize() })
            } else {
                this.fitMapToDocuments(true)
            }

            if (this.editable) {
                // deep clone : https://stackoverflow.com/questions/122102/what-is-the-most-efficient-way-to-deep-clone-an-object-in-javascript
                this.initialGeometry = JSON.parse(JSON.stringify(this.editedDocument.geometry))

                this.setModifyInteractions()
                this.setDrawInteraction()
                this.setDragAndDropInteraction()
            } else {
                // if map is not editable, feature are clickable
                this.map.on('pointermove', this.onPointerMove)
                this.map.on('click', this.onClick)
            }
        },

        methods: {

            setModifyInteractions() {
                let source = this.documentsLayer.getSource()
                let modify = new ol.interaction.Modify({ source })

                this.map.addInteraction(modify)
                this.map.addInteraction(new ol.interaction.Snap({ source }))

                modify.on('modifyend', (event) => {
                    for (let feature of event.features.getArray()) {
                        this.updateDocumentGeometryFromFeature(feature)
                    }
                })
            },

            setDrawInteraction() {
                let source = this.documentsLayer.getSource()

                if (this.drawInteraction) {
                    this.map.removeInteraction(this.drawInteraction)
                }

                this.drawInteraction = null

                // sometimes, geom may not be set on edited documents
                this.editedDocument.geometry = this.editedDocument.geometry || {}

                if (!this.editedDocument.geometry.geom) {
                    this.drawInteraction = new ol.interaction.Draw({
                        source: source,
                        type: 'Point'
                    })
                } else if (this.geomDetailEditable && !this.editedDocument.geometry.geom_detail) {
                    this.drawInteraction = new ol.interaction.Draw({
                        source: source,
                        type: 'LineString'
                    })
                }

                if (this.drawInteraction) {
                    this.map.addInteraction(this.drawInteraction)

                    this.drawInteraction.on('drawend', (event) => {
                        this.setDocumentGeometryFromFeature(event.feature, false)
                    })
                }
            },

            // https://openlayers.org/en/latest/examples/drag-and-drop.html
            setDragAndDropInteraction() {
                let dragAndDrop = new ol.interaction.DragAndDrop({
                    formatConstructors: [ol.format.GPX, ol.format.KML]
                })

                dragAndDrop.on('addfeatures', function(event) {
                    this.setDocumentGeometryFromFeature(event.features[0])
                }.bind(this))

                this.map.addInteraction(dragAndDrop)
            },

            updateDocumentGeometryFromFeature(feature) {
                let document = feature.get('document')

                if (!document) {
                    return
                }

                this.setDocumentGeometry(document, feature.get('geometry'))
            },

            setDocumentGeometryFromGpx(gpx) {
                let gpxFormat = new ol.format.GPX()
                let feature = gpxFormat.readFeature(gpx, { featureProjection: 'EPSG:3857' })

                this.setDocumentGeometryFromFeature(feature)
            },

            setDocumentGeometryFromFeature(feature, fitMap = true) {
                this.setDocumentGeometry(this.editedDocument, feature.get('geometry'))
                this.drawDocumentMarkers()

                if (fitMap) {
                    this.fitMapToDocuments(true)
                }

                this.setDrawInteraction()
            },

            setDocumentGeometry(document, geometry) {
                let geoJsonGeometry = geoJSONFormat.writeGeometryObject(geometry)

                if (geoJsonGeometry.type === 'Point') {
                    // remove elevation and timestamp
                    geoJsonGeometry.coordinates = geoJsonGeometry.coordinates.slice(0, 2)
                    document.geometry.geom = JSON.stringify(geoJsonGeometry)
                } else if (geoJsonGeometry.type === 'LineString' || geoJsonGeometry.type === 'MultiLineString') {
                    document.geometry.geom_detail = JSON.stringify(geoJsonGeometry)

                    if (!document.geometry.geom) {
                        let mainLine = geometry.getType() === 'MultiLineString' ? geometry.getLineString(0) : geometry
                        this.setDocumentGeometry(document, new ol.geom.Point(mainLine.getCoordinateAt(0.5)))
                    }
                } else if (geoJsonGeometry.type === 'Polygon') {
                    document.geometry.geom_detail = JSON.stringify(geoJsonGeometry)
                } else {
                    throw new Error(`Unexpected geometry type : ${geometry.type}`)
                }
            },

            drawDocumentMarkers() {
                var documentsSource = this.documentsLayer.getSource()
                var waypointsSource = this.waypointsLayer.getSource()

                documentsSource.clear()
                waypointsSource.clear()

                this.addDocumentFeature(this.oldDocument, documentsSource, buildDiffStyle(true))
                this.addDocumentFeature(this.newDocument, documentsSource, buildDiffStyle(false))

                this.addDocumentFeature(this.editedDocument, documentsSource)

                for (let document of this.documents || []) {
                    this.addDocumentFeature(document, documentsSource)

                    if (document.associations) {
                        for (let waypoint of document.associations.waypoints || []) {
                            this.addDocumentFeature(waypoint, waypointsSource)
                        }
                        for (let waypoint of document.associations.waypoint_children || []) {
                            this.addDocumentFeature(waypoint, waypointsSource)
                        }
                    }
                }
            },

            addDocumentFeature(document, source, style) {
                if (!document || !document.geometry) {
                    return
                }

                let title = this.$documentUtils.getDocumentTitle(document)

                if (document.geometry.geom) {
                    let feature = this.addFeature(
                        source,
                        JSON.parse(document.geometry.geom),
                        style || getDocumentPointStyle(document, title, false),
                        style ? null : getDocumentPointStyle(document, title, true)
                    )

                    feature.set('document', document)
                    feature.setId(document.document_id)
                }

                if (document.geometry.geom_detail) {
                    this.addFeature(
                        source,
                        JSON.parse(document.geometry.geom_detail),
                        style || getDocumentLineStyle(title, false),
                        style ? null : getDocumentLineStyle(title, true)
                    ).set('document', document)
                }
            },

            addFeature(source, data, normalStyle, highlightedStyle) {
                if (!data) {
                    return
                }

                let feature = geoJSONFormat.readFeature(data)

                feature.set('normalStyle', normalStyle)

                if (highlightedStyle) {
                    feature.set('highlightedStyle', highlightedStyle)
                }

                feature.setStyle(normalStyle)
                source.addFeature(feature)

                return feature
            },

            setMaxZoom() {
                const maxZoom = this.visibleLayer.get('maxZoom')

                if (this.view.getZoom() > maxZoom) {
                    this.view.setZoom(maxZoom)
                }

                this.view.set('maxZoom', maxZoom)
            },

            addBiodivSportsData(response) {
                const results = response['data']['results']
                const source = this.protectionAreasLayer.getSource()

                for (let result of results) {
                    let geometry = geoJSONFormat.readGeometry(result['geometry'], {
                        dataProjection: 'EPSG:4326',
                        featureProjection: 'EPSG:3857'
                    })

                    const feature = new ol.Feature({
                        geometry,
                        'id': (result['id']),
                        'biodivData': {
                            'source': 'biodivsports',
                            'title': (result['name']),
                            'description': (result['description']),
                            'infoUrl': (result['info_url']),
                            'kmlUrl': (result['kml_url']),
                            'period': (result['period'])
                        }
                    })

                    feature.setId('biodiv_' + (result['id']))

                    feature.set('normalStyle', buildPolygonStyle(result.name, false))
                    feature.set('highlightedStyle', buildPolygonStyle(
                        this.$gettext('Sensitive area:') + result.name,
                        true
                    ))
                    feature.setStyle(feature.get('normalStyle'))

                    source.addFeature(feature)
                    this.$emit('has-protection-area')
                }
            },

            // If user want's to filter with map, it will send extent to url
            // otherwise, it set bbox url to undefined
            sendBoundsToUrl() {
                var bounds = this.view.calculateExtent()
                var query = Object.assign({}, this.$route.query)

                query.bbox = this.filterDocumentsWithMap ? bounds.map(Math.round).join(',') : undefined
                if (query.bbox !== this.$route.query.bbox) {
                    this.$router.push({ query: query })
                }
            },

            fitMapToDocuments(force) {
                if ((this.filterDocumentsWithMap || this.editable) && !force) {
                    return
                }

                let extent = ol.extent.createEmpty()

                for (let layer of [this.documentsLayer, this.waypointsLayer]) {
                    ol.extent.extend(extent, layer.getSource().getExtent())
                }

                if (extent.filter(isFinite).length !== 4) {
                    // if there is infnity, default extent
                    // TODO need to be current extent if it exists ...
                    extent = DEFAULT_EXTENT
                }

                this.view.fit(extent, { size: this.map.getSize() })

                // set a minimum zoom level
                this.view.setZoom(Math.min(DEFAULT_POINT_ZOOM, this.view.getZoom()))
            },

            toogleMapLayer(layer) {
                layer.setVisible(!layer.getVisible())
            },

            onPointerMove(event) {
                var resultFeature = null

                this.map.forEachFeatureAtPixel(event.pixel, function(feature) {
                    resultFeature = feature
                    return true
                })

                this.setHighlightedFeature(resultFeature)
                this.$emit('highlightDocument', resultFeature ? resultFeature.get('document') : null)
            },

            setHighlightedFeature(feature) {
                if (feature === this.highlightedFeature) {
                    return
                }

                if (this.highlightedFeature) {
                    this.highlightedFeature.setStyle(this.highlightedFeature.get('normalStyle'))
                }

                this.highlightedFeature = feature

                if (feature && feature.get('highlightedStyle')) {
                    feature.setStyle(feature.get('highlightedStyle'))
                }
            },

            onClick(event) {
                const feature = this.map.forEachFeatureAtPixel(event.pixel, feature => feature)

                if (feature) {
                    const document = feature.get('document')
                    if (document) {
                        this.$router.push({
                            name: this.$documentUtils.getDocumentType(document.type),
                            params: { id: document.document_id }
                        })
                    } else if (feature.get('biodivData')) {
                        this.biodivData = feature.get('biodivData')
                        this.$refs.BiodivInformation.show()
                    }
                } else {
                    // handle clicks on enabled layers TODO
                    if (this.showProtectionAreas && !this.editable) { // FIXME rather check visible layers
                        const extent = this.view.calculateExtent(this.map.getSize() || null)
                        const rcpExtent = ol.proj.transformExtent(extent, ol.proj.get('EPSG:3857'), ol.proj.get('EPSG:21781'))
                        const position = ol.proj.transform(event.coordinate, ol.proj.get('EPSG:3857'), ol.proj.get('EPSG:21781'))
                        respecterCestProtegerService.identify(
                            position,
                            rcpExtent,
                            this.map.getSize()[0],
                            this.map.getSize()[1],
                            this.$language.current
                        ).then(response => {
                            this.swissProtectionAreaData = response.data.results
                                .flatMap(zone => zone.properties)[0]
                                console.log(this.swissProtectionAreaData)
                            this.$refs.SwissProtectionAreaInformation.show()
                        })
                    }
                }
            },

            centerOnGeolocation() {
                this.geolocation.setTracking(true)

                // TODO : not tracking mode,
                // * add a spinner showing that it's waiting
                // * remove handler once it's loaded
                const setCenter = function() {
                    var position = this.geolocation.getPosition()
                    this.view.setCenter(position)
                }

                this.geolocation.on('change:position', setCenter.bind(this))
            },

            searchRecenterPropositions(event) {
                let query = event.target.value

                if (query && query.length >= 3) {
                    const center = this.view.getCenter()
                    const centerWgs84 = ol.proj.toLonLat(center)

                    this.recenterPropositions = photon.getPropositions(query, this.$language.current, centerWgs84)
                    this.showRecenterOnPropositions = true
                }
            },

            // https://github.com/c2corg/v6_ui/blob/c9962a6c3bac0670eab732d563f9f480379f84d1/c2corg_ui/static/js/map/search.js#L194
            recenterOn(item) {
                const feature = geoJSONFormat.readFeature(item)
                let extent = feature.get('extent')
                let coordinates = feature.getGeometry().flatCoordinates

                if (extent) {
                    extent = ol.proj.transformExtent(extent, 'EPSG:4326', 'EPSG:3857')
                    this.view.fit(extent, { size: this.map.getSize(), maxZoom: 12 })
                } else {
                    coordinates = ol.proj.transform(coordinates, 'EPSG:4326', 'EPSG:3857')
                    this.view.setCenter(coordinates)
                    this.view.setZoom(16)
                }

                this.showRecenterOnPropositions = false
            },

            getProtectionAreas() {
                if (!this.showProtectionAreas || this.editable) {
                    return
                }

                const extent = this.view.calculateExtent(this.map.getSize() || null)

                // get extent in WGS format
                const bsExtent = ol.proj.transformExtent(extent, ol.proj.get('EPSG:3857'), ol.proj.get('EPSG:4326'))
                biodivSportsService.fetchData(bsExtent, this.biodivSportsActivities, this.$language.current)
                    .then(this.addBiodivSportsData)
                    // .catch(response => console.warn(response))
            },

            clearGeometry() {
                this.editedDocument.geometry.geom = null
                this.editedDocument.geometry.geom_detail = null
                this.drawDocumentMarkers() // redraw markers
                this.setDrawInteraction() // reset interaction mode
            },

            resetGeometry() {
                this.editedDocument.geometry = JSON.parse(JSON.stringify(this.initialGeometry))
                this.drawDocumentMarkers() // redraw markers
                this.setDrawInteraction() // reset interaction mode
            }
        }
    }
</script>

<style lang="scss">
    // for styling ol elements
    .ol-attribution{
        background: white!important;

    }
</style>

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

    button {
        width:auto;
        font-size:1rem;
        font-weight: normal;
        padding:3px;

        svg {
            margin-right: 3px;
        }
    }
}

.ol-control-recenter-on{
    top: 35px;
    left:3em;
}

.ol-control-recenter-on-propositions{
    top: 65px;
    left:3em;
    background: rgba(255,255,255,0.9);
    padding:5px;

    li:hover{
        background: lightgrey;
        cursor: pointer;
    }
}

.ol-control-reset-geometry{
    top: 5px;
    right:5px;

    button{
        padding:5px;
        width: auto!important;
        font-weight: normal;
    }
}

.ol-control-clear-geometry{
    top: 35px;
    right:5px;

    button{
        padding:5px;
        width: auto!important;
        font-weight: normal;
    }
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
