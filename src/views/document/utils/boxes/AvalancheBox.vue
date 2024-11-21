<template>
  <div v-if="showAvalancheInfo" class="box no-print is-relative">
    <div class="title" v-translate>Avalanche risk</div>
    <template v-if="bras?.length">
      <template v-if="bulletinsWithInfo">
        <div class="icon-bra is-flex is-justify-content-center">
          <icon-bra :size="120" :level="Math.max(...bras.map((bra) => bra.danger.max).filter(Boolean))" />
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
<script>
import { booleanIntersects as turfBooleanIntersects } from '@turf/boolean-intersects';
import { buffer as turfBuffer } from '@turf/buffer';
import { simplify as turfSimplify } from '@turf/simplify';

import IconBra from '../../../../components/generics/icons/IconBra';

import yetiService from '@/js/apis/yeti-service.js';
import ol from '@/js/libs/ol';
import { requireDocumentProperty } from '@/js/properties-mixins';

const GeoJSON = new ol.format.GeoJSON();

export default {
  components: {
    IconBra,
  },

  mixins: [requireDocumentProperty],

  data() {
    return {
      bras: null,
      bulletinsWithInfo: 0,
    };
  },

  computed: {
    yetiUrl() {
      return { name: 'yeti', params: { document_id: this.document.document_id } };
    },

    showAvalancheInfo() {
      if (this.document?.type !== 'r') {
        return false;
      }

      const activities = ['skitouring', 'snow_ice_mixed', 'ice_climbing', 'snowshoeing'];

      return this.document.activities?.some((activity) => activities.includes(activity));
    },
  },

  mounted() {
    if (this.showAvalancheInfo) {
      yetiService.zonesBra().then((response) => {
        // use WGS 84 projection for buffering with turf
        const routeGeometry = turfBuffer(
          turfSimplify(
            GeoJSON.writeGeometryObject(
              GeoJSON.readGeometry(JSON.parse(this.document.geometry.geom_detail ?? this.document.geometry.geom), {
                dataProjection: 'EPSG:3857',
                featureProjection: 'EPSG:4326',
              })
            ),
            { tolerance: 0.01, highQuality: false }
          ),
          this.document.geometry.geom_detail ? 1 : 2,
          {
            units: 'kilometers',
          }
        ).geometry;

        const zones = response.data.features.filter((feature) =>
          turfBooleanIntersects(turfBuffer(feature.geometry, 0.001, { units: 'kilometers' }).geometry, routeGeometry)
        );

        if (zones.length) {
          const m = new Map(zones.map((zone) => [zone.properties.name + '@' + zone.properties.country, zone]));
          yetiService.bra().then((response) => {
            this.bras = response.data.zones
              .filter((zone) => m.has(zone.zone + '@' + zone.country))
              .map((zone) => ({ ...m.get(zone.zone + '@' + zone.country).properties, ...zone }));
            this.bulletinsWithInfo = this.bras.map((bra) => bra.danger.max).filter(Boolean).length;
          });
        }
      });
    }
  },

  methods: {
    orientations(bra) {
      // return truthy orientations, in uppercase
      return Object.keys(bra.orientations)
        .filter((key) => key !== 'comment')
        .filter((key) => bra.orientations[key])
        .map((val) => val.toUpperCase());
    },
    validity(bra) {
      return this.$dateUtils.toLocalizedString(new Date(bra.validUntil), 'DD/MM/YYYY HH:mm');
    },
    expired(bra) {
      // return true when validUntil is expired (warn user)
      return new Date() - new Date(bra.validUntil) > 0;
    },
  },
};
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
