<template>
  <div ref="overlayElement" class="overlay">
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

<script setup lang="ts">
import axios from 'axios';
import type MapBrowserEvent from 'ol/MapBrowserEvent';
import type { Coordinate } from 'ol/coordinate';
import { computed, nextTick, onMounted, ref, useTemplateRef, watch } from 'vue';

import { useLayer } from './layer';

import { protectionAreasLayers } from '@/components/map/map-layers';
import Yetix from '@/components/yeti/yetix';
import respecterCestProtegerService from '@/js/apis/respectercestproteger-service';
import { useGlobalProperties } from '@/js/composables/global-properties';
import ol from '@/js/libs/ol';
import { sanitizeHtml } from '@/js/sanitize-html';
import utils from '@/js/utils';

type OverlayData = {
  coordinate?: Coordinate;
  title?: string;
  category?: string;
  constraint?: string | null;
  dates?: string | number[];
  dispositions?: string | null;
  additionalInfos?: string;
  contact?: string | null;
  url?: string;
};

const emit = defineEmits(['layer']);

const { map, view } = useLayer();
const { $gettext, $language } = useGlobalProperties();

const overlayPanOptions = {
  animation: {
    duration: 250,
  },
  margin: 10,
};

const overlay = new ol.Overlay({
  positioning: 'top-center',
  offset: [0, 0],
  className: 'protectedareas-overlay-container',
});
const overlayElement = useTemplateRef<HTMLElement>('overlayElement');
const overlayData = ref<OverlayData | null>(null);

const showProtectedAreas = computed(() => Yetix.showProtectedAreas as boolean);

function onShowProtectedAreas() {
  Yetix.setShowProtectedAreas(!showProtectedAreas.value);
}

const layerSelector = computed(() => ({
  title: $gettext('Protected Areas'),
  checked: showProtectedAreas.value,
  action: onShowProtectedAreas,
  image: 'protected-areas.jpg',
}));

// get swiss protected areas, with other default parameters
const protectionLayers = protectionAreasLayers().map((layer) => {
  layer.setVisible(true);
  layer.setOpacity(1);
  (layer.getSource() as unknown as { crossOrigin: string }).crossOrigin = 'anonymous';
  return layer;
});
// then add biodiv sport data
const biodivLayer = new ol.layer.Tile({
  source: new ol.source.TileWMS({
    url: 'https://api.ensg.eu/geoserver/yeti/wms',
    params: { LAYERS: 'yeti:biodiv-sports.fr' },
    attributions: '<a href="https://biodiv-sports.fr" target="_blank">Biodiv\'Sports</a>',
    crossOrigin: 'anonymous',
  }),
});
biodivLayer.set('name', 'biodivLayer');
// create group for layers
const layer = new ol.layer.Group({
  layers: [...protectionLayers, biodivLayer],
  visible: false,
});
layer.set('name', 'protected-areas');

function getLayer() {
  return layer;
}

function closeOverlay() {
  overlay.setPosition(undefined);
  overlayData.value = null;
}

function updateVisibility() {
  layer.setVisible(showProtectedAreas.value);
  if (showProtectedAreas.value && overlayData.value) {
    overlay.setPosition(overlayData.value.coordinate);
  } else {
    closeOverlay();
  }
}

function setOverlayData(
  coordinate: Coordinate,
  title: string,
  category: string,
  constraint: string | null,
  dates: string | number[],
  dispositions: string | null,
  additionalInfos: string,
  contact: string | null,
  url: string
): OverlayData {
  return {
    coordinate,
    title,
    category,
    constraint,
    dates,
    dispositions,
    // additionalInfos and contact are HTML fragments coming from third-party geodata
    // services (respectercestproteger-service / biodiv-sports): sanitize them before
    // they get bound with v-html.
    additionalInfos: sanitizeHtml(additionalInfos),
    contact: sanitizeHtml(contact),
    url,
  };
}

function onMapClick(evt: MapBrowserEvent<PointerEvent>) {
  // open overlay first, populate data afterward
  overlay.setPosition(evt.coordinate);

  overlayData.value = {
    category: $gettext('Data is loading...'),
  };

  // data can be from france or swiss,
  // test both, and pick the one that respond (using Promise.any)

  const swissPromise = new Promise<OverlayData>((resolve, reject) => {
    const size = map.value.getSize()!;
    const extent = map.value.getView().calculateExtent(size);
    respecterCestProtegerService
      .identify(
        evt.coordinate as [number, number],
        extent as [number, number, number, number],
        size[0],
        size[1],
        $language.current!
      )
      .catch(() => {
        overlayData.value = {
          category: $gettext('Network error.'),
        };
        throw new Error('network error');
      })
      .then(({ data }) => {
        if (data.results && data.results.length) {
          const result =
            data.results.find((item: { geometry: { type: string } }) => item.geometry.type === 'MultiPolygon') ??
            data.results[0];

          const current = $language.current;
          const lang = current && ['fr', 'de', 'it'].includes(current) ? current : 'fr';

          resolve(
            setOverlayData(
              evt.coordinate,
              result.properties.label,
              result.layerName,
              utils.decodeHtmlEntities(result.properties[`schutzs_${lang}`] ?? ''),
              result.properties.schutzzeit,
              utils.decodeHtmlEntities(result.properties[`best_${lang}`] ?? ''),
              result.properties.zusatzinformation ?? '',
              null,
              result.properties.url_kanton
            )
          );
        } else {
          reject(new Error('no data'));
        }
      });
  });

  const francePromise = new Promise<OverlayData>((resolve, reject) => {
    const biodivGetFeatureInfoUrl = biodivLayer
      .getSource()!
      .getFeatureInfoUrl(evt.coordinate, view.value.getResolution()!, 'EPSG:3857', {
        INFO_FORMAT: 'application/json',
        QUERY_LAYERS: 'yeti:biodiv-sports.fr',
        LAYERS: 'yeti:biodiv-sports.fr',
        FEATURE_COUNT: 5,
      })!;

    const current = $language.current;
    const lang = current && ['fr', 'en', 'it'].includes(current) ? current : 'en';

    axios
      .get(biodivGetFeatureInfoUrl)
      .catch(() => {
        overlayData.value = {
          category: $gettext('Network error.'),
        };
        throw new Error('network error');
      })
      .then(({ data }) => {
        if (data.features?.length) {
          const features = new ol.format.GeoJSON().readFeatures(data);

          // select last feature
          const feature = features[features.length - 1];

          const titles = JSON.parse(feature.get('name'));
          const title = titles[lang] ?? titles['fr'];

          const descriptions = JSON.parse(feature.get('description'));
          const description = descriptions[lang] ?? descriptions['fr'];

          const contact = feature.get('contact').replaceAll('<br /><br />', '<br />');

          let period: string | number[];
          try {
            // convert "(12:1,0,0,1,1,1,1,1,1,0,0,0)" to array
            period = feature.get('period').replaceAll(/[()]/g, '').split(':')[1].split(',').map(Number);
          } catch {
            period = '---';
          }

          resolve(
            setOverlayData(
              evt.coordinate,
              title,
              feature.get('species_id') ? $gettext('Species zone') : $gettext('Regulatory zone'),
              null,
              period,
              '',
              description,
              contact,
              feature.get('info_url')
            )
          );
        } else {
          reject(new Error('no data'));
        }
      });
  });

  // set overlay data with france or swiss
  Promise.any([francePromise, swissPromise])
    .then((data) => {
      overlayData.value = data;
      nextTick(() => {
        overlay.panIntoView(overlayPanOptions);
      });
    })
    .catch(() => {
      overlayData.value = {
        category: $gettext('Error while loading data'),
      };
    });
}

function onMapLooseClick() {
  closeOverlay();
}

watch(showProtectedAreas, updateVisibility);

onMounted(() => {
  map.value.addLayer(layer);
  updateVisibility();

  // overlay
  overlay.setElement(overlayElement.value!);
  map.value.addOverlay(overlay);

  // emit layer data for selector
  emit('layer', layerSelector.value);
});

// OverlaysLayers gives the map events to the layers
defineExpose({ getLayer, onMapClick, onMapLooseClick });
</script>

<style scoped lang="scss">
@import '@/assets/sass/variables';

.overlay {
  width: 400px;
  max-width: 100%;
  background: #fff;
  border-radius: 4px;
  box-shadow:
    0 0 3px rgba($black, 0.5),
    0 3px 8px rgba($black, 0.5);
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
