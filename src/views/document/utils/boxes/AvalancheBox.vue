<template>
  <div v-if="showAvalancheInfo" class="box no-print is-relative">
    <icon-bra
      v-if="bras?.length === 1 && bras[0].danger.max"
      :level="bras[0].danger.max"
      class="avalanche-danger-single"
    />
    <div class="title" v-translate>Avalanche risk</div>
    <template v-if="bras?.length === 1">
      <div v-for="bra in bras" :key="bra.id">
        <dl>
          <dt v-translate>Area:</dt>
          <dd>{{ bra.fullname ?? bra.zone }}</dd>
          <dt v-translate>Country:</dt>
          <dd>{{ bra.country }}</dd>
        </dl>
        <template v-if="bra.danger.low">
          <div class="is-flex is-justify-content-space-around is-align-items-center px-3">
            <danger-level :danger="bra.danger" />
            <input-orientation disabled :value="orientations(bra)" black-white />
          </div>
          <dl v-if="bra.danger.comment || bra.orientations.comment">
            <template v-if="bra.danger.comment">
              <dt v-translate>Danger:</dt>
              <dd>{{ bra.danger.comment }}</dd>
            </template>
            <template v-if="bra.orientations.comment">
              <dt v-translate>Orientations:</dt>
              <dd>{{ bra.orientations.comment }}</dd>
            </template>
            <dt v-translate>Validity date:</dt>
            <dd>
              {{ validity(bra) }}
              <template v-if="expired(bra)">
                <fa-icon icon="exclamation-circle" class="has-text-danger" :title="$gettext('Validity date expired')" />
              </template>
            </dd>
          </dl>
        </template>
        <div v-else class="py-2">
          <p><span v-translate key="id2">No avalanche bulletin right now</span></p>
        </div>
        <template v-if="bra.urls.length">
          <dt v-translate>Full bulletin:</dt>
          <dd>
            <span v-for="(url, i) in bra.urls" :key="i">
              <a :href="url.url" target="_blank"> ©{{ url.title }} </a>
              <template v-if="i + 1 < bra.urls.length">&bull; </template>
            </span>
          </dd>
        </template>
        <div class="py-3">
          <icon-yeti fixed-width />
          <router-link :to="yetiUrl"><span v-translate>Prepare your outing with YETI</span></router-link>
        </div>
      </div>
    </template>
    <div v-else>
      <template v-if="bras?.length">
        <div>
          <span class="is-italic" v-translate>
            Several bulletins match, only higher risk is displayed. See details below.
          </span>
        </div>

        <div class="is-flex is-justify-content-center">
          <icon-bra size="100" :level="Math.max(...bras.map((bra) => bra.danger.max))" />
        </div>

        <div>
          <span v-for="(bra, index) in bras" :key="bra.id">
            <a :href="bra.urls[0].url" :title="bra.fullname" target="_blank">{{ bra.name }}</a>
            <template v-if="index + 1 < bras.length">&bull; </template>
          </span>
        </div>
      </template>

      <div class="py-3">
        <icon-yeti fixed-width />
        <router-link :to="yetiUrl"><span v-translate>Prepare your outing with YETI</span></router-link>
      </div>
    </div>
  </div>
</template>
<script>
import turfBooleanIntersects from '@turf/boolean-intersects';

import IconBra from '../../../../components/generics/icons/IconBra';
import InputOrientation from '../../../../components/generics/inputs/InputOrientation';
import DangerLevel from '../../../../components/yeti/map-layers/DangerLevel';

import yetiService from '@/js/apis/yeti-service.js';
import ol from '@/js/libs/ol';
import { requireDocumentProperty } from '@/js/properties-mixins';

const GeoJSON = new ol.format.GeoJSON();

export default {
  components: {
    IconBra,
    InputOrientation,
    DangerLevel,
  },

  mixins: [requireDocumentProperty],

  data() {
    return {
      bras: null,
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
        const routeGeometry = JSON.parse(this.document.geometry.geom_detail ?? this.document.geometry.geom);

        const zones = response.data.features.filter((feature) => {
          const polygon = GeoJSON.writeGeometryObject(
            GeoJSON.readGeometry(feature.geometry, {
              dataProjection: 'EPSG:4326',
              featureProjection: 'EPSG:3857',
            })
          );
          return turfBooleanIntersects(polygon, routeGeometry);
        });

        if (zones.length) {
          const m = new Map(zones.map((zone) => [zone.properties.name + '@' + zone.properties.country, zone]));
          yetiService.bra().then((response) => {
            this.bras = response.data.zones
              .filter((zone) => m.has(zone.zone + '@' + zone.country))
              .map((zone) => ({ ...m.get(zone.zone + '@' + zone.country).properties, ...zone }));
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
.avalanche-danger-single {
  position: absolute;
  top: 0;
  right: 0;
}
</style>
