<template>
  <div ref="bulletinsOverlay" class="bulletins-overlay">
    <button class="delete is-small button-close" @click="closeOverlay">x</button>
    <div class="bulletins-header pb-3 has-text-centered">
      <p class="title is-5 mb-1">
        {{ overlayData.mountainName }}
      </p>
      <p class="title is-7 country-name">
        {{ overlayData.country }}
      </p>
      <dropdown-content inverted v-if="overlayData.fullName" class="mx-2 is-size-7">
        <span v-translate>Merged regions</span>
        <template #content>
          <div class="is-size-7 has-text-left">
            {{ overlayData.fullName }}
          </div>
        </template>
      </dropdown-content>
    </div>
    <div v-if="overlayData.danger.low" class="py-2">
      <p class="is-size-7 px-3 pb-5">
        <span><strong v-translate>Validity date:</strong> {{ overlayValidUntil }}</span>
        <strong v-if="overlayValidUntilExpired" class="is-block has-text-danger">
          <fa-icon icon="exclamation-circle" />
          <span v-translate key="id1">Validity date expired</span>
        </strong>
      </p>
      <div class="is-flex is-justify-content-space-around is-align-items-center px-3">
        <danger-level :danger="overlayData.danger" />
        <input-orientation disabled :value="overlayOrientations" />
      </div>
      <dl v-if="overlayDangerComment || overlayOrientationsComment" class="is-size-6 px-3 pt-3">
        <template v-if="overlayDangerComment">
          <dt v-translate>Danger:</dt>
          <dd>{{ overlayDangerComment }}</dd>
        </template>
        <template v-if="overlayOrientationsComment">
          <dt v-translate>Orientations:</dt>
          <dd>{{ overlayOrientationsComment }}</dd>
        </template>
      </dl>
    </div>
    <div v-else class="py-2">
      <p class="is-size-6 p-3"><span v-translate key="id2">No avalanche bulletin right now</span></p>
    </div>
    <div class="is-size-7 px-3 pt-2 pb-2 bulletins-footer" v-if="overlayData.urls.length">
      <p v-for="(url, i) in overlayData.urls" :key="i">
        <strong>©{{ url.title }}</strong>
        <a :href="url.url" target="_blank">
          <fa-icon icon="external-link-alt" />
          <span v-translate>Full bulletin</span>
        </a>
      </p>
    </div>
    <img :src="overlayDangerIcon" alt="" class="bulletins-overlay-danger-icon" />
  </div>
</template>
<script>
import { buffer as turfBuffer } from '@turf/buffer';
import { difference as turfDifference } from '@turf/difference';
import { featureCollection as turfFeatureCollection } from '@turf/helpers';
import { intersect as turfIntersect } from '@turf/intersect';

import layerMixin from './layer';

import DropdownContent from '@/components/yeti/DropdownContent.vue';
import Yetix from '@/components/yeti/Yetix';
import DangerLevel from '@/components/yeti/map-layers/DangerLevel';
import ol from '@/js/libs/ol';

// min and max zooms for layers styles
const MIN_ZOOM = 8;
const MAX_ZOOM = 10;

let mountainsStyle = (feature, mapZoom, danger) => {
  const MIN_OPACITY = 0;
  const MAX_OPACITY = 0.9;

  let opacity = MAX_OPACITY;
  let strokeWidth = 1;

  let bufferedGeometryValue = 'bufferedGeometry_0';

  if (mapZoom) {
    // opacity should be gradually decreasing between min and max zooms
    // also, set buffered geometry based on zoom
    if (mapZoom >= MIN_ZOOM && mapZoom <= MAX_ZOOM) {
      opacity = (MAX_ZOOM - mapZoom) * (MAX_OPACITY / (MAX_ZOOM - MIN_ZOOM));
    } else if (mapZoom > MAX_ZOOM) {
      opacity = MIN_OPACITY;
      bufferedGeometryValue = 'bufferedGeometry_1';
      // increase stroke when zoom > max
      strokeWidth = 2;
    }
  }

  danger = danger || 0;

  // #fff, #cbdb45, #fff100, #f6921e, #ec1c24, #ec1c24
  let dangerFill = ['255, 255, 255', '203, 219, 69', '255, 241, 0', '246, 146, 30', '236, 28, 36', '236, 28, 36'];

  let styles = [
    new ol.style.Style({
      fill: new ol.style.Fill({
        color: `rgba(${dangerFill[danger]}, ${opacity})`,
      }),
    }),
  ];

  if (feature && mapZoom < Yetix.VALID_MINIMUM_MAP_ZOOM) {
    styles.push(
      new ol.style.Style({
        fill: new ol.style.Fill({
          color: `rgba(${dangerFill[danger]}, 0.75)`,
        }),
        geometry: feature.get(bufferedGeometryValue),
      })
    );
  }

  // add stroke on top
  styles.push(
    new ol.style.Style({
      stroke: new ol.style.Stroke({
        color: 'rgba(0, 0, 0, 0.85)',
        width: strokeWidth,
      }),
    })
  );

  return styles;
};

let iconSize = 80;

let bulletinsIcon = (danger) => {
  danger = danger || 0;

  // #999, #cbdb45, #fff100, #f6921e, #ec1c24, #ec1c24
  let dangerFill = ['153, 153, 153', '203, 219, 69', '255, 241, 0', '246, 146, 30', '236, 28, 36', '236, 28, 36'];

  let svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${iconSize}" height="${iconSize}" viewBox="-50 0 200 100">
      <path d="M5,50L50,5L95,50" fill="white" />
      <path d="M5,50L50,95L95,50" fill="rgb(${dangerFill[danger]})" />
      <path d="m50,0l50,50-50,50-50-50zv5L21,33l19-10L50,26l9-8L80,38l2-1L50,5M5,50L50,95L95,50" />
  `;

  if (danger === 0) {
    svg += `
      <g stroke-width="5" stroke="black">
        <line x1="40" x2="60" y1="58" y2="78" />
        <line x1="40" x2="60" y1="78" y2="58" />
      </g>
    `;
  }
  if (danger === 1) {
    svg += `
      <path d="m54 84h-6l-0.1-21.1c-2.3 2.1-4.9 4-8 5v-5.6c1.6-0.5 3.2-2 5.1-3.4 1.9-1.5 3.1-3 3.8-4.9h5z" />
    `;
  }
  if (danger === 2) {
    svg += `
      <path d="m60 77v5.1l-20 0.1c0.2-2.1 1-3.9 2.1-5.7q1.6-2.7 6.4-7.2 3.9-3.6 4.8-4.9 1.2-1.8 1.2-3.5 0-2-1.1-3-1-1-2.8-1-1.8 0-2.8 1.1c-0.7 0.7-1.6 1.3-1.7 3h-5.9c0.4-3.1 2-5.5 3.8-6.8q2.7-2.1 6.7-2.1 4.5 0 7 2.4 2.6 2.4 2.6 5.9 0 2.1-0.8 3.9-0.7 1.8-2.3 3.8-1 1.4-3.7 3.9-2.8 2.5-3.5 3.3c-0.5 0.5-0.8 1.3-1.1 1.8 0 0 11.1-0.1 11.1-0.1z" />

      <path d="M86,45a7,7,0,106.5-13.5a7,7,0,00-10.5-8a5.4,5.4,0,00-10.2,3" />
      <path d="M69,27L86,44a5,5,0,104-12a5,5,0,10-9-5a3,3,0,10-8,0" fill="white" />
      <path d="M85,32a1,1,0,110,8v-2a1,1,0,100-4" />
    `;
  }
  if (danger === 3) {
    svg += `
      <path d="m58 81q-2.9 2.8-7.2 2.8-4.1 0-6.7-2.3c-1.8-1.6-2.1-4.2-2.4-6.7h5c0.2 1.4 0.5 2.4 1.2 3.1q1.2 1.1 2.9 1.1 1.7 0 3-1.3 1.2-1.4 1.2-3.7c0-1.4 0.1-1.6-0.7-2.4-0.8-0.9-1.3-1.8-2.7-1.8-1.4-0.1-2.6 0-3.9 0l0.1-4c3.3 0 3.9-1 4.7-1.7q1.2-1.1 1.2-2.8 0-1.5-0.9-2.4-0.9-0.9-2.3-0.9-1.5 0-2.5 1c-0.7 0.7-1.2 1.5-1.4 2.8h-5c0.4-1.8 0.7-4 1.5-5.1q1.1-1.6 3.1-2.6 2-0.9 4.4-0.9 4.3 0 6.8 2.7 2.1 2.2 2.1 5 0 3.9-4.3 6.3 2.6 0.5 4.1 2.5 1.6 1.9 1.6 4.6 0 3.9-2.9 6.7z" />

      <path d="M54,22L79,50h33a5,5,0,10-4-22.3a11.3,11.3,0,00-20,0q-8-2,-14,6" />
      <path d="M55,21L82,48h30a5,5,0,10-5-18a9.7,9.7,0,00-18,0q-7-2,-11,3L60,16" fill="white" />
      <path d="M59,18l25,25-1.5,1.5-25-25M87,38a1,1,0,1110,5l-2-1a1,1,0,10-6-3" />
    `;
  }
  if (danger === 4) {
    svg += `
      <path d="m60 78h-3l-0.1 6-4.9-0.1 0.1-5.9h-13.1v-4.9l13.1-19.1h4.8l0.1 19 3-0.1zm-7.9-4.9l-0.1-10.1-7.9 10.1z" />
    `;
  }
  if (danger === 5) {
    svg += `
      <path d="m58 80q-2.8 3.8-7.9 3.8-4.1 0-6.6-2.2-2.6-2.1-3.1-5.8h5.6c0.1 1.2 0.7 1.7 1.4 2.4q1.2 1.1 2.7 1.1 1.8 0 3-1.4 1.2-1.4 1.2-4.3 0-2.7-1.2-4.1-1.2-1.3-3.1-1.3c-1.6 0-2.7 0.2-4 1.6h-5l3.1-15.9h14.9v4.9h-10.9l-1 6c1.2-0.6 2.8-1.1 4.1-1.1q3.7 0 6.3 2.7 2.6 2.8 2.6 7.1 0 3.6-2.1 6.5z" />
    `;
  }
  if (danger === 4 || danger === 5) {
    svg += `
      <path d="M54,22L79,50h52a12.5,12.5,0,001.5-24.4a7,7,0,00-8.2-7a11.9,11.9,0,00-22.5-2q-11-1,-14,7q-10-2-14,4" />
      <path d="M52,24L77,48h50a5,5,0,103-21a5,5,0,00-7-6a10.3,10.3,0,00-20-2q-11-2,-14,7q-10-3-14,4L60,16" fill="white" />
      <path d="M59,18l25,25-1.5,1.5-25-25m-1.5,1.5l22.5,22.5-1.5,1.5-22.5-22.5M87,38a1,1,0,1110,5l-2-1a1,1,0,10-6-3M96,29a1,1,0,1115,14l-1.7-1.7A1,1,0,1097.7,30.7" />
    `;
  }

  svg += '</svg>';

  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
};

let bulletinsStyle = (mapZoom, danger) => {
  // no icon when zoom < MIN_ZOOM
  if (mapZoom < MIN_ZOOM) {
    return new ol.style.Style({});
  }
  return new ol.style.Style({
    image: new ol.style.Icon({
      src: bulletinsIcon(danger),
      size: [iconSize, iconSize],
    }),
  });
};

let mountainsLayer = new ol.layer.VectorImage({
  source: new ol.source.Vector(),
  style: mountainsStyle(),
});
let bulletinsLayer = new ol.layer.Vector({
  name: 'bulletinsLayer',
  source: new ol.source.Vector(),
});
let mountainsLayerGroup = new ol.layer.Group({
  layers: [mountainsLayer, bulletinsLayer],
});
let bulletinsOverlay = new ol.Overlay({
  positioning: 'top-center',
  offset: [0, 0],
  className: 'bulletins-overlay-container',
});
let bulletinsOverlayPanOptions = {
  animation: {
    duration: 250,
  },
  margin: 10,
};

export default {
  components: {
    DangerLevel,
    DropdownContent,
  },
  mixins: [layerMixin],
  data() {
    return {
      overlayData: {
        country: null,
        mountainName: null,
        fullName: null,
        validUntil: null,
        danger: {},
        orientations: [],
        urls: [],
      },
      panIntoView: false,
    };
  },
  computed: {
    mapZoom() {
      return Yetix.mapZoom;
    },
    showAvalancheBulletins() {
      return Yetix.showAvalancheBulletins;
    },
    bulletinsLoaded() {
      return Yetix.bulletinsLoaded;
    },
    editMode() {
      return Yetix.editMode;
    },
    overlayOrientations() {
      // return truthy orientations, in uppercase
      return Object.keys(this.overlayData.orientations)
        .filter((key) => key !== 'comment')
        .filter((key) => this.overlayData.orientations[key])
        .map((val) => val.toUpperCase());
    },
    overlayValidUntil() {
      return this.$dateUtils.toLocalizedString(new Date(this.overlayData.validUntil), 'DD/MM/YYYY HH:mm');
    },
    overlayValidUntilExpired() {
      // return true when validUntil is expired (warn user)
      return new Date() - new Date(this.overlayData.validUntil) > 0;
    },
    overlayDangerIcon() {
      return bulletinsIcon(this.overlayData.danger.max);
    },
    overlayDangerComment() {
      return this.overlayData.danger.low ? this.overlayData.danger.comment : null;
    },
    overlayOrientationsComment() {
      return this.overlayData.orientations.comment;
    },
    layerSelector() {
      return {
        title: this.$gettext('Avalanche bulletins'),
        checked: this.showAvalancheBulletins,
        action: this.onShowAvalancheBulletins,
        image: 'avalanche.jpg',
      };
    },
  },
  watch: {
    showAvalancheBulletins() {
      this.loadAndUpdateAvalancheBulletins();
    },
  },
  mounted() {
    // clear layers when mounted (useful when navigating c2c)
    mountainsLayer.getSource().clear();
    bulletinsLayer.getSource().clear();

    // data
    this.activeBulletins = null;
    this.selectedFeature = null;

    // bulletins overlay
    bulletinsOverlay.setElement(this.$refs.bulletinsOverlay);
    this.map.addOverlay(bulletinsOverlay);

    // prevent event on map when overlay is open
    this.$refs.bulletinsOverlay.addEventListener('pointermove', (evt) => {
      evt.stopImmediatePropagation();
      Yetix.$emit('map-pointermove', evt);
    });

    this.map.addLayer(mountainsLayerGroup);
    // layers are not visible on load
    mountainsLayerGroup.setVisible(this.showAvalancheBulletins);
    bulletinsLayer.setVisible(this.showAvalancheBulletins);

    // only on first mount, if mountains already loaded
    if (Yetix.mountains.all.length === 0) {
      Yetix.fetchMountains().then(this.onMountainsResult);

      Yetix.$on('map-moveend', this.onMapMoveEnd);
    }
    this.$emit('layer', this.layerSelector);
  },
  methods: {
    getLayer() {
      return bulletinsLayer;
    },
    onMountainsResult(data) {
      let mountainsFeatures = this.getFeaturesFromData(data);

      // add to mountains layer
      mountainsLayer.getSource().addFeatures(mountainsFeatures);

      // build inner strokes for each mountains
      let format = new ol.format.GeoJSON({ featureProjection: 'EPSG:3857' });
      let distances = [2, 0.5];
      mountainsFeatures.forEach((mountain) => {
        let turfPolygon = format.writeFeatureObject(mountain);

        distances.forEach((distance, i) => {
          let innerBuffer = turfBuffer(turfPolygon, -distance, { steps: 1 });
          let innerDiff;
          if (innerBuffer) {
            innerDiff = turfDifference(turfFeatureCollection([turfPolygon, innerBuffer]));
          } else {
            innerDiff = turfPolygon;
          }
          let bufferedGeometry = format.readGeometry(innerDiff.geometry);
          mountain.set(`bufferedGeometry_${i}`, bufferedGeometry);
        });
      });

      let mountains = this.getPropertiesFromFeatures(mountainsFeatures);
      mountains = this.sortMountainsByMassif(mountains);

      Yetix.setAllMountains(mountains);

      this.setVisibleMountains();

      if (this.showAvalancheBulletins) {
        this.loadAndUpdateAvalancheBulletins();
      }
    },
    sortMountainsByMassif(mountains) {
      // first, order mountains by massifs
      let sortedMountains = {};
      for (let i = 0; i < mountains.length; i++) {
        if (!sortedMountains[mountains[i].mountain]) {
          sortedMountains[mountains[i].mountain] = [];
        }
        sortedMountains[mountains[i].mountain].push(mountains[i]);
      }

      // then sort by massif
      mountains = Object.keys(sortedMountains)
        .sort()
        .reduce((obj, key) => {
          obj[key] = sortedMountains[key];
          return obj;
        }, {});

      // then sort mountains inside each massif
      let key = 'name';
      for (let i in mountains) {
        mountains[i].sort((a, b) => {
          if (a[key] < b[key]) return -1;
          if (a[key] > b[key]) return 1;
          return 0;
        });
      }

      return mountains;
    },
    setVisibleMountains() {
      let mapExtent = this.getExtent('EPSG:3857');
      // clone this.mountains first, with no reference
      let visibleMountains = Object.assign({}, Yetix.mountains.all);

      // then filter if polygon isn’t in view
      for (let massif in visibleMountains) {
        visibleMountains[massif] = visibleMountains[massif].filter((mountain) => {
          let polygon = mountain.geometry;
          return polygon.intersectsExtent(mapExtent);
        });
        // unset massif if empty
        if (visibleMountains[massif].length === 0) {
          delete visibleMountains[massif];
        }
      }
      // set mountains in visible
      Yetix.setVisibleMountains(visibleMountains);
    },
    updateMountainsStyle() {
      mountainsLayer
        .getSource()
        .getFeatures()
        .forEach((mountain) => {
          let bulletin = mountain.get('bulletinsFeature');
          let danger = bulletin ? bulletin.get('overlayData').danger.max : 0;
          mountain.setStyle(mountainsStyle(mountain, this.mapZoom, danger));
        });
      bulletinsLayer
        .getSource()
        .getFeatures()
        .forEach((bulletin) => {
          let danger = bulletin.get('overlayData').danger.max;
          bulletin.setStyle(bulletinsStyle(this.mapZoom, danger));
          bulletin.set('normalStyle', bulletinsStyle(this.mapZoom, danger));
        });
    },
    onMapMoveEnd() {
      // set visible mountains
      this.setVisibleMountains();

      if (this.showAvalancheBulletins) {
        this.updateMountainsStyle();
        this.updateBulletinsGeometry();
      }
    },
    onMapClick(evt, feature) {
      // do not allow clicks on smaller zoom
      if (this.mapZoom < MIN_ZOOM) {
        this.closeOverlay(true);
        return false;
      }
      this.setBulletinsOverlay(evt, feature);
    },
    onMapLooseClick() {
      this.closeOverlay(true);
    },
    onMapPointerMove(evt, feature) {
      this.selectedFeature = feature;

      let style = feature.get('normalStyle');
      let hoveredStyle = style.clone();
      if (hoveredStyle.getImage()) {
        hoveredStyle.getImage().setScale(1.2);
        feature.setStyle(hoveredStyle);
      }
    },
    onMapLoosePointerMove() {
      if (this.selectedFeature !== null) {
        this.selectedFeature.setStyle(this.selectedFeature.get('normalStyle'));
        this.selectedFeature = null;
      }
    },
    onShowAvalancheBulletins() {
      Yetix.setShowAvalancheBulletins(!this.showAvalancheBulletins);
    },
    loadAndUpdateAvalancheBulletins() {
      // first time, bulletins are not loaded yet
      if (!this.bulletinsLoaded) {
        Yetix.setBulletinsLoaded(true);
        // so load them
        Yetix.fetchBulletins().then(this.onBulletinsResult);
      }
      // show mountains layer group if needed
      mountainsLayerGroup.setVisible(this.showAvalancheBulletins);
      bulletinsLayer.setVisible(this.showAvalancheBulletins);
      // update styles
      this.updateMountainsStyle();
      this.updateBulletinsGeometry();
    },
    onBulletinsResult(data) {
      let bulletinsFeatures = data.data;
      let mountainsFeatures = mountainsLayer.getSource().getFeatures();

      // match up bulletin data and zone
      bulletinsFeatures.zones.forEach((zone) => {
        mountainsFeatures.find((mountain) => {
          // if name and country match, create bulletin
          if (mountain.get('name') === zone.zone && mountain.get('country') === zone.country) {
            // check validity first
            // if no longer valid (expires 48h), set danger to null
            if ((new Date() - new Date(zone.validUntil)) / 1000 > 60 * 60 * 24 * 2) {
              zone.danger = {
                low: null,
                max: null,
              };
            }
            let mountainGeometry = mountain.getGeometry();
            let mountainGeometryType = mountainGeometry.getType();

            let bulletinsGeometry = null;

            if (mountainGeometryType === 'MultiPolygon') {
              bulletinsGeometry = mountainGeometry.getInteriorPoints();
            } else {
              throw new Error('Mountain geometry have to be MultiPolygon.');
            }

            // create feature (bulletin icons)
            // geometry have to be MultiPoint
            let bulletinsFeature = new ol.Feature({
              geometry: bulletinsGeometry,
              initialGeometry: bulletinsGeometry,
              overlayData: {
                country: mountain.get('country'),
                mountainName: mountain.get('name'),
                fullName: mountain.get('fullname'),
                validUntil: zone.validUntil,
                danger: zone.danger,
                orientations: zone.orientations,
                urls: mountain.get('urls'),
              },
            });
            bulletinsLayer.getSource().addFeature(bulletinsFeature);

            // set styles
            bulletinsFeature.setStyle(bulletinsStyle(this.mapZoom, zone.danger.max));
            bulletinsFeature.set('normalStyle', bulletinsStyle(this.mapZoom, zone.danger.max));
            mountain.setStyle(mountainsStyle(mountain, this.mapZoom, zone.danger.max));

            mountain.setProperties({ bulletinsFeature });

            // break
            return true;
          }
        });
      });
      // update in case we're already zoomed in
      this.updateBulletinsGeometry();
    },
    updateBulletinsGeometry() {
      // return, if bulletins are not loaded
      if (!this.bulletinsLoaded) {
        return;
      }

      // no update if overlay is animating into view when opens
      // = prevent overlay from moving
      if (this.panIntoView) {
        this.panIntoView = false;
        // update bulletin overlay though (hide/show if needed)
        this.updateBulletinsOverlay();
        return;
      }

      // if zoom > 10
      //   we will intersect every polygon with the map extent, and update geometry of avalanche bulletin icons (icons will always be visible, even when zoomed)
      // else
      //   we set geometry of all points to be the initial geometry (stored during the request)
      if (this.mapZoom > 10) {
        let mapExtent = this.getExtent('EPSG:3857');
        let mapExtentFeature = new ol.Feature(ol.geom.polygonFromExtent(mapExtent));

        let mountainsFeatures = mountainsLayer.getSource().getFeatures();

        mountainsFeatures.forEach((feature) => {
          let featureCollection = {
            type: 'FeatureCollection',
            features: [
              new ol.format.GeoJSON().writeFeatureObject(feature),
              new ol.format.GeoJSON().writeFeatureObject(mapExtentFeature),
            ],
          };
          let intersect = turfIntersect(featureCollection);
          if (intersect) {
            let intersectFeature = new ol.format.GeoJSON().readFeature(intersect);

            let intersectGeometry = intersectFeature.getGeometry();
            let intersectType = intersectGeometry.getType();

            // if polygon, should be MultiPolygon
            if (intersectType === 'Polygon') {
              intersectFeature = new ol.Feature({
                geometry: new ol.geom.MultiPolygon([intersectGeometry]),
              });
            }

            let newBulletinsFeature = intersectFeature.getGeometry().getInteriorPoints();

            let bulletinsFeature = feature.get('bulletinsFeature');
            if (bulletinsFeature) {
              bulletinsFeature.setGeometry(newBulletinsFeature);
            }
          }
        });
      } else {
        let bulletinsFeatures = bulletinsLayer.getSource().getFeatures();
        bulletinsFeatures.forEach((feature) => {
          feature.setGeometry(feature.get('initialGeometry'));
        });
      }

      // update bulletin overlay
      this.updateBulletinsOverlay();
    },
    setBulletinsOverlay(evt, clickedBulletinFeature) {
      // set mountain name
      this.overlayData = clickedBulletinFeature.get('overlayData');
      // find the closest point (because it's a MultiPoint)
      let closestPointCoordinate = clickedBulletinFeature.getGeometry().getClosestPoint(evt.coordinate);
      // set overlay position
      this.openOverlay(closestPointCoordinate, true);
      // store this point
      this.activeBulletins = {
        feature: clickedBulletinFeature,
      };
      // if there are more than one point in multipoint
      // find the closest one and store index too
      let points = clickedBulletinFeature.getGeometry().getPoints();
      if (points.length > 1) {
        points.forEach((point, index) => {
          if (point.getCoordinates().every((coord, i) => coord === closestPointCoordinate[i])) {
            this.activeBulletins.index = index;
          }
        });
      }
    },
    updateBulletinsOverlay() {
      if (this.activeBulletins && this.showAvalancheBulletins) {
        let activeFeature = this.activeBulletins.feature;
        let activeIndex = this.activeBulletins.index || 0;
        // try to get point
        let activePoint = activeFeature.getGeometry().getPoint(activeIndex);
        if (!activePoint) {
          activePoint = activeFeature.getGeometry().getPoint(0);
        }
        this.openOverlay(activePoint.getCoordinates());
      } else {
        this.closeOverlay();
      }
    },
    openOverlay(coordinates, panIntoView = false) {
      this.$nextTick(() => {
        bulletinsOverlay.setPosition(coordinates);

        if (panIntoView) {
          this.panIntoView = true;
          bulletinsOverlay.panIntoView(bulletinsOverlayPanOptions);
        }
      });
    },
    closeOverlay(force = false) {
      bulletinsOverlay.setPosition(undefined);

      if (force) {
        this.activeBulletins = null;
      }
    },
  },
};
</script>

<style scoped lang="scss">
@import '@/assets/sass/variables';

.bulletins-overlay {
  width: 300px;
  max-width: 100%;
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 0 3px rgba($black, 0.5), 0 3px 8px rgba($black, 0.5);
  overflow: hidden;

  p,
  dl {
    user-select: text;
  }
}
.bulletins-header {
  background: $primary;
  padding-top: 2rem;

  .title {
    color: white;
  }
}
.bulletins-footer {
  background: $grey-lighter;
}
.bulletins-overlay-danger-icon {
  position: absolute;
  top: -40px; /* iconSize / 2 */
  left: 0;
  right: 0;
  margin: auto;
  z-index: 2;
  pointer-events: none;
  transform: scale(1.2);
}
.country-name {
  opacity: 0.75;
}
dt,
dd {
  display: inline;
}
dt {
  font-weight: bold;
}
.button-close {
  position: absolute;
  top: 4px;
  right: 4px;
}
</style>

<style lang="scss">
/* Not scoped styles */
.yeti-app {
  .bulletins-overlay-container {
    max-width: 90%;
  }
  .bulletins-overlay {
    .input-orientation {
      width: 70px;
      height: 70px;
    }
  }
}
</style>
