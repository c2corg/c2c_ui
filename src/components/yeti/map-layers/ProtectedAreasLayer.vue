<template>
  <div ref="overlay" class="overlay">
    <button class="delete is-small button-close" @click="closeOverlay">x</button>
    <div class="overlay-header pb-3 has-text-centered">
      <p class="title is-5 mb-1" v-translate>Protected areas</p>
    </div>
    <div class="py-2 px-3 is-size-6">
      <p>{{ overlayData?.category }}</p>
      <p class="title is-5 mb-3 mt-1">{{ overlayData?.title }}</p>
      <p class="my-2 dates">
        <fa-icon icon="calendar" v-if="overlayData?.dates" class="mr-1" />
        <span v-if="typeof overlayData?.dates === 'string'">
          {{ overlayData?.dates }}
        </span>
        <span v-else>
          <span
            v-for="(month, i) in overlayData?.dates"
            :key="i"
            class="sensitive-item"
            :class="{ nok: month }"
            :title="
              $dateUtils.month(i).toUpperCase()[0] +
              $dateUtils.month(i).slice(1) +
              ': ' +
              (month ? $gettext('Sensitive period') : $gettext('Non sensitive period'))
            "
          >
            {{ $dateUtils.month(i).toUpperCase()[0] }}
          </span>
        </span>
        <fa-icon icon="circle-info" v-if="overlayData?.constraint" class="mr-1 ml-2" />
        <span>{{ overlayData?.constraint }}</span>
      </p>
      <p class="my-2">
        <strong>{{ overlayData?.dispositions }}</strong>
      </p>
      <div class="my-2 overlay-text">
        <div v-html="overlayData?.additionalInfos"></div>
      </div>
      <hr />
      <p v-if="overlayData?.contact" v-html="overlayData.contact" class="contact mb-2 mt-5"></p>
      <p v-if="overlayData?.url">
        <a :href="overlayData.url" target="_blank">
          <fa-icon icon="external-link-alt" />
          <span v-translate>Learn more</span>
        </a>
      </p>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

import layerMixin from './layer';

import { protectionAreasLayers } from '@/components/map/map-layers';
import Yetix from '@/components/yeti/Yetix';
import respecterCestProtegerService from '@/js/apis/respectercestproteger-service';
import ol from '@/js/libs/ol';
import utils from '@/js/utils';

let overlay = new ol.Overlay({
  positioning: 'top-center',
  offset: [0, 0],
  className: 'protectedareas-overlay-container',
});

let overlayPanOptions = {
  animation: {
    duration: 250,
  },
  margin: 10,
};

export default {
  mixins: [layerMixin],
  data() {
    return {
      overlayData: null,
    };
  },
  computed: {
    showProtectedAreas() {
      return Yetix.showProtectedAreas;
    },
    layerSelector() {
      return {
        title: this.$gettext('Protected Areas'),
        checked: this.showProtectedAreas,
        action: this.onShowProtectedAreas,
        image: 'protected-areas.jpg',
      };
    },
  },
  watch: {
    showProtectedAreas() {
      this.updateVisibility();
    },
  },
  created() {
    // get swiss protected areas
    let protectionLayers = protectionAreasLayers();
    // change default parameters
    protectionLayers = protectionLayers.map((layer) => {
      layer.setVisible(true);
      layer.setOpacity(1);
      layer.getSource().crossOrigin = 'anonymous';
      return layer;
    });
    // then add biodiv sport data
    let biodivLayer = new ol.layer.Tile({
      name: 'biodivLayer',
      source: new ol.source.TileWMS({
        url: 'https://api.ensg.eu/geoserver/yeti/wms',
        params: { LAYERS: 'yeti:biodiv-sports.fr' },
        attributions: '<a href="https://biodiv-sports.fr" target="_blank">Biodiv\'Sports</a>',
        crossOrigin: 'anonymous',
      }),
    });
    // create group for layers
    this.layer = new ol.layer.Group({
      name: 'protected-areas',
      layers: [...protectionLayers, biodivLayer],
      visible: false,
    });
  },
  mounted() {
    this.map.addLayer(this.layer);
    this.updateVisibility();

    // overlay
    overlay.setElement(this.$refs.overlay);
    this.map.addOverlay(overlay);

    // emit layer data for selector
    this.$emit('layer', this.layerSelector);
  },
  methods: {
    onShowProtectedAreas() {
      Yetix.setShowProtectedAreas(!this.showProtectedAreas);
    },
    updateVisibility() {
      this.layer.setVisible(this.showProtectedAreas);
      if (this.showProtectedAreas && this.overlayData) {
        overlay.setPosition(this.overlayData.coordinate);
      } else {
        this.closeOverlay();
      }
    },
    onMapClick(evt) {
      // open overlay first, populate data afterward
      overlay.setPosition(evt.coordinate);

      this.overlayData = {
        category: this.$gettext('Data is loading...'),
      };

      // data can be from france or swiss,
      // test both, and pick the one that respond (using Promise.any)

      let swissPromise = new Promise((resolve, reject) => {
        let extent = this.map.getView().calculateExtent(this.map.getSize() || null);
        respecterCestProtegerService
          .identify(evt.coordinate, extent, this.map.getSize()[0], this.map.getSize()[1], this.$language.current)
          .then(({ data }) => {
            if (data.results && data.results.length) {
              let result = data.results.find((result) => result.geometry.type === 'MultiPolygon') ?? data.results[0];

              let lang = this.$language.current;
              if (!['fr', 'de', 'it'].includes(lang)) {
                lang = 'fr';
              }

              let overlayData = this.setOverlayData(
                evt.coordinate,
                result.properties.label,
                result.layerName,
                utils.decodeHtmlEntities(result.properties[`schutzs_${lang}`] ?? ''),
                result.properties.schutzzeit,
                utils.decodeHtmlEntities(result.properties[`best_${lang}`] ?? ''),
                result.properties.zusatzinformation ?? '',
                null,
                result.properties.url_kanton
              );
              resolve(overlayData);
            } else {
              reject(new Error('no data'));
            }
          });
      });

      let francePromise = new Promise((resolve, reject) => {
        let biodivLayer = this.layer.getLayers().getArray()[2];
        let biodivGetFeatureInfoUrl = biodivLayer
          .getSource()
          .getFeatureInfoUrl(evt.coordinate, this.view.getResolution(), 'EPSG:3857', {
            INFO_FORMAT: 'application/json',
            QUERY_LAYERS: 'yeti:biodiv-sports.fr',
            LAYERS: 'yeti:biodiv-sports.fr',
            FEATURE_COUNT: 5,
          });

        let lang = this.$language.current;
        if (!['fr', 'en', 'it'].includes(lang)) {
          lang = 'en';
        }

        axios
          .get(biodivGetFeatureInfoUrl)
          .catch(() => {
            reject(new Error('network error'));
          })
          .then(({ data }) => {
            if (data.features?.length) {
              let features = new ol.format.GeoJSON().readFeatures(data);

              // select last feature
              let feature = features[features.length - 1];

              let title = JSON.parse(feature.get('name'));
              title = title[lang] ?? title['fr'];

              let description = JSON.parse(feature.get('description'));
              description = description[lang] ?? description['fr'];

              let contact = feature.get('contact');
              contact = contact.replaceAll('<br /><br />', '<br />');

              let period = feature.get('period');
              try {
                // convert "(12:1,0,0,1,1,1,1,1,1,0,0,0)" to array
                period = period
                  .replaceAll(/[\(\)]/g, '')
                  .split(':')[1]
                  .split(',')
                  .map(Number);
              } catch (e) {
                period = '---';
              }

              let overlayData = this.setOverlayData(
                evt.coordinate,
                title,
                feature.get('species_id') ? this.$gettext('Species zone') : this.$gettext('Regulatory zone'),
                null,
                period,
                '',
                description,
                contact,
                feature.get('info_url')
              );
              resolve(overlayData);
            } else {
              reject(new Error('no data'));
            }
          });
      });

      // set overlay data with france or swiss
      Promise.any([francePromise, swissPromise])
        .then((overlayData) => {
          this.overlayData = overlayData;
          this.$nextTick(() => {
            overlay.panIntoView(overlayPanOptions);
          });
        })
        .catch(() => {
          this.overlayData = {
            category: this.$gettext('Error while loading data'),
          };
        });
    },
    onMapLooseClick() {
      this.closeOverlay();
    },
    setOverlayData(coordinate, title, category, constraint, dates, dispositions, additionalInfos, contact, url) {
      return {
        coordinate,
        title,
        category,
        constraint,
        dates,
        dispositions,
        additionalInfos,
        contact,
        url,
      };
    },
    closeOverlay() {
      overlay.setPosition(undefined);
      this.overlayData = null;
    },
  },
  render() {
    return null;
  },
};
</script>

<style scoped lang="scss">
@import '@/assets/sass/variables';

.overlay {
  width: 400px;
  max-width: 100%;
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 0 3px rgba($black, 0.5), 0 3px 8px rgba($black, 0.5);
  overflow: hidden;

  p {
    user-select: text;
  }
}
.overlay-header {
  background: hsl(74, 42%, 45%);
  padding-top: 1rem;

  .title {
    color: white;
  }
}
.overlay-text {
  max-height: 200px;
  overflow: auto;
  user-select: text;
  padding-bottom: 1em;
  margin-bottom: 1em;
  transition: max-height 0.3s;
}
.dates {
  font-size: 0.929em;
}
.contact {
  font-size: 0.857em;
}
.button-close {
  position: absolute;
  top: 4px;
  right: 4px;
}
.sensitive-item {
  display: inline-block;
  padding: 0 0.2em;

  &.nok {
    background: #ffe08a;
  }
}
</style>
