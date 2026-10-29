<script setup lang="ts">
import type Feature from 'ol/Feature';
import type MapBrowserEvent from 'ol/MapBrowserEvent';
import { computed, nextTick, onMounted, watch } from 'vue';

import { useLayer } from './layer';

import WinterRouteLayerContent from '@/components/yeti/map-layers/WinterRouteLayerContent.vue';
import WinterRouteLayerContentTitle from '@/components/yeti/map-layers/WinterRouteLayerContentTitle.vue';
import Yetix from '@/components/yeti/yetix';
import { useGlobalProperties } from '@/js/composables/global-properties';
import ol from '@/js/libs/ol';

// renderless: it only adds OpenLayers layers to the map
defineOptions({ render: () => null });

const emit = defineEmits(['layer']);

const { $gettext } = useGlobalProperties();
const { map, view } = useLayer();

const showWinterRoute = computed(() => Yetix.showWinterRoute);
const winterRoutes = computed(() => Yetix.winterRoutes);

const layerSelector = computed(() => ({
  id: 'winter-route',
  title: $gettext('Winter hiking routes'),
  checked: showWinterRoute.value,
  action: onShowWinterRoute,
  image: 'winter-route.png',
  contentComponent: WinterRouteLayerContent,
  contentTitleComponent: WinterRouteLayerContentTitle,
}));

// OpenLayers objects, kept out of reactive state
const layer = new ol.layer.Tile<InstanceType<typeof ol.source.TileWMS>>();
// read by OverlaysLayers
layer.set('name', 'winterRouteLayer');
const pWidth = 4;
const selectedLayer = new ol.layer.Vector({
  source: new ol.source.Vector(),
  style: [
    new ol.style.Style({
      stroke: new ol.style.Stroke({
        color: 'hsla(10deg, 95%, 50%, 0.5)',
        //color: 'rgba(30, 30, 30, 0.6)',
        width: pWidth + 12,
      }),
    }),
    new ol.style.Style({
      stroke: new ol.style.Stroke({
        color: 'rgba(30, 30, 30, 1)',
        width: pWidth,
      }),
    }),
  ],
});

function getLayer() {
  return layer;
}

function onShowWinterRoute() {
  Yetix.setShowWinterRoute(!showWinterRoute.value);
}

function updateVisibility() {
  layer.setVisible(showWinterRoute.value);
  selectedLayer.setVisible(showWinterRoute.value);
  if (showWinterRoute.value) {
    // set legend
    setLegend();
  } else {
    Yetix.setWinterRouteLegend(null);
  }
}

function setLegend() {
  const legend = [
    {
      title: $gettext('Winter hiking routes'),
      image: 'winter-route-icon1.png',
    },
    {
      title: $gettext('Tricky sections'),
      text: $gettext(
        'Some routes feature tricky sections where there is a risk of slipping dangerously (risk of impact or falling from a great height), falling into crevasses, collapsing seracs or drowning after falling through the ice on a mountain lake. To reduce the risk of slipping, it is often advisable to progress on foot, wearing crampons and suitably secured with rope.'
      ),
      image: 'winter-route-icon2.png',
    },
  ];
  Yetix.setWinterRouteLegend(legend);
}

function onMapClick(evt: MapBrowserEvent<PointerEvent>) {
  const url = layer.getSource()!.getFeatureInfoUrl(evt.coordinate, view.value.getResolution()!, 'EPSG:3857', {
    INFO_FORMAT: 'application/json',
    QUERY_LAYERS: 'yeti:TRACERANDOHIVERNALEFUSION',
    LAYERS: 'yeti:TRACERANDOHIVERNALEFUSION',
  });
  if (url) {
    fetch(url)
      .then((response) => response.json())
      .then((json) => {
        // if not shift key, first remove all features
        if (!evt.originalEvent.shiftKey) {
          Yetix.setWinterRoutes([]);
        }
        // then, if new feature
        nextTick(() => {
          const source = selectedLayer.getSource()!;
          if (json.features.length) {
            const features = new ol.format.GeoJSON().readFeatures(json) as Feature[];
            // getFeatureInfo returns only one
            const feature = features[0];
            // feature already there
            let isSameFeature = false;
            source.forEachFeature((_feature) => {
              if (_feature.get('id') === feature.get('id')) {
                isSameFeature = true;
                // remove if shift key
                if (evt.originalEvent.shiftKey) {
                  source.removeFeature(_feature);
                }
              }
            });
            if (!isSameFeature) {
              source.addFeature(feature);
            }
          }
          // set features
          Yetix.setWinterRoutes(source.getFeatures());
        });
      });
  }
}

function onMapLooseClick() {
  // clear
  Yetix.setWinterRoutes([]);
}

function onMapPointerMove() {
  map.value.getTargetElement()!.style.cursor = 'pointer';
}

function onMapLoosePointerMove() {
  map.value.getTargetElement()!.style.cursor = '';
}

watch(showWinterRoute, updateVisibility);

watch(winterRoutes, () => {
  if (winterRoutes.value.length === 0) {
    selectedLayer.getSource()!.clear();
  }
});

watch(layerSelector, () => emit('layer', layerSelector.value));

onMounted(() => {
  // add layer first (maintain order)
  map.value.addLayer(layer);
  map.value.addLayer(selectedLayer);

  // then  set source
  layer.setSource(
    new ol.source.TileWMS({
      url: 'https://api.ensg.eu/geoserver/yeti/wms',
      params: { LAYERS: 'yeti:TRACERANDOHIVERNALE' },
      attributions: '<a href="https://www.petzl.com/fondation/s/?language=fr">© PETZL</a>',
      crossOrigin: 'anonymous',
    })
  );
  updateVisibility();
  emit('layer', layerSelector.value);
});

defineExpose({ getLayer, onMapClick, onMapLooseClick, onMapPointerMove, onMapLoosePointerMove });
</script>
