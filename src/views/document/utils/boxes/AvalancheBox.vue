<template>
  <div v-if="showAvalancheInfo" class="box no-print is-relative">
    <div class="title" v-translate>Avalanche risk</div>
    <template v-if="bras?.length">
      <template v-if="bulletinsWithInfo">
        <div class="icon-bra is-flex is-justify-content-center">
          <icon-bra :size="120" :level="maxLevel" />
        </div>
        <div class="has-text-centered">
          <span v-for="(bra, index) in bras" :key="bra.id">
            <a :href="bra.urls[0].url" :title="bra.fullname" target="_blank">
              {{ bra.name }}<template v-if="bra.fullname"> ({{ bra.country }})</template>
            </a>
            <template v-if="index + 1 < bras.length">&bull; </template>
          </span>
        </div>
      </template>
      <div v-else class="py-2">
        <p><span v-translate key="id2">No avalanche bulletin right now</span></p>
      </div>
      <hr />
    </template>
    <div>
      <icon-yeti fixed-width />
      <router-link :to="yetiUrl"><span v-translate>Use YETI to better analyze avalanche risk</span></router-link>
    </div>
  </div>
</template>
<script setup lang="ts">
import { booleanIntersects as turfBooleanIntersects } from '@turf/boolean-intersects';
import { buffer as turfBuffer } from '@turf/buffer';
import { simplify as turfSimplify } from '@turf/simplify';
import type { Feature, FeatureCollection, Geometry, MultiPolygon, Polygon } from 'geojson';
import { computed, onMounted, ref } from 'vue';

import IconBra from '@/components/generics/icons/IconBra.vue';
import yetiService from '@/js/apis/yeti-service';
import { useGlobalProperties } from '@/js/composables/global-properties';
import ol from '@/js/libs/ol';
import { documentProperty } from '@/js/properties';

const GeoJSON = new ol.format.GeoJSON();

const props = defineProps({ ...documentProperty });

const { $dateUtils } = useGlobalProperties();

// a zone of the avalanche bulletins (BRA), and its bulletin
type Zone = Feature<Polygon | MultiPolygon, { name: string; country: string }>;
type Bra = {
  id: string;
  name: string;
  fullname?: string;
  country: string;
  zone: string;
  urls: { url: string }[];
  danger: { max: number | null };
  orientations: Record<string, unknown>;
  validUntil: string;
};

const bras = ref<Bra[] | null>(null);
const bulletinsWithInfo = ref(0);

// the highest danger level of the bulletins (shown when one has a level)
const maxLevel = computed(() => Math.max(...(bras.value ?? []).map((bra) => bra.danger.max ?? 0)));

const yetiUrl = computed(() => ({ name: 'yeti', params: { document_id: props.document.document_id } }));

const showAvalancheInfo = computed(() => {
  if (props.document?.type !== 'r') {
    return false;
  }

  const activities = ['skitouring', 'snow_ice_mixed', 'ice_climbing', 'snowshoeing'];

  return props.document.activities?.some((activity: string) => activities.includes(activity));
});

function orientations(bra: Bra) {
  // return truthy orientations, in uppercase
  return Object.keys(bra.orientations)
    .filter((key) => key !== 'comment')
    .filter((key) => bra.orientations[key])
    .map((val) => val.toUpperCase());
}

function validity(bra: Bra) {
  return $dateUtils.toLocalizedString(new Date(bra.validUntil), 'DD/MM/YYYY HH:mm');
}

function expired(bra: Bra) {
  // return true when validUntil is expired (warn user)
  return Date.now() - new Date(bra.validUntil).getTime() > 0;
}

onMounted(() => {
  if (showAvalancheInfo.value) {
    const geometry = props.document.geometry!;
    yetiService.zonesBra().then((response: { data: FeatureCollection<Polygon | MultiPolygon, Zone['properties']> }) => {
      // use WGS 84 projection for buffering with turf
      const routeGeometry = (
        turfBuffer(
          turfSimplify(
            GeoJSON.writeGeometryObject(
              GeoJSON.readGeometry(JSON.parse((geometry.geom_detail ?? geometry.geom)!), {
                dataProjection: 'EPSG:3857',
                featureProjection: 'EPSG:4326',
              })!
            ) as Geometry,
            { tolerance: 0.01, highQuality: false }
          ),
          geometry.geom_detail ? 1 : 2,
          {
            units: 'kilometers',
          }
        ) as Feature<Polygon | MultiPolygon>
      ).geometry;

      const zones = response.data.features.filter((feature) =>
        turfBooleanIntersects(turfBuffer(feature.geometry, 0.001, { units: 'kilometers' })!.geometry, routeGeometry)
      );

      if (zones.length) {
        const m = new Map(zones.map((zone) => [zone.properties.name + '@' + zone.properties.country, zone]));
        yetiService.bra().then((response: { data: { zones: Bra[] } }) => {
          const found = response.data.zones
            .filter((zone) => m.has(zone.zone + '@' + zone.country))
            .map((zone) => ({ ...m.get(zone.zone + '@' + zone.country)!.properties, ...zone }));
          bras.value = found;
          bulletinsWithInfo.value = found.map((bra) => bra.danger.max).filter(Boolean).length;
        });
      }
    });
  }
});
</script>
<style scoped lang="scss">
dl,
dt,
dd {
  margin: 0;
  padding: 0;
}
dt,
dd {
  display: inline;
}
dt {
  font-weight: bold;
}
dt::before {
  content: '';
  display: block;
}
.icon-bra {
  margin: -35px 0 -25px 0;
}
</style>
