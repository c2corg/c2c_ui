<template>
  <component :is="showHelper ? 'dropdown-button' : 'span'">
    <span slot="button">
      <span v-if="document.global_rating" :title="$gettext('global_rating')">
        {{ document.global_rating }}
      </span>

      <span v-if="document.via_ferrata_rating" :title="$gettext('via_ferrata_rating')">
        {{ document.via_ferrata_rating }}
      </span>

      <span>
        <span v-if="document.rock_free_rating" :title="$gettext('rock_free_rating')">
          {{ formatBoulderRating(document.rock_free_rating)
          }}<!--
              --></span
        ><!--
              --><span v-if="document.rock_required_rating" :title="$gettext('rock_required_rating')"
          ><!--
              -->&gt;{{ document.rock_required_rating }}
        </span>
      </span>

      <span v-if="document.aid_rating" :title="$gettext('aid_rating')">
        {{ document.aid_rating }}
      </span>

      <span v-if="document.engagement_rating" :title="$gettext('engagement_rating')">
        {{ document.engagement_rating }}
      </span>

      <span v-if="document.risk_rating" :title="$gettext('risk_rating')">
        {{ document.risk_rating }}
      </span>

      <span v-if="document.equipment_rating" :title="$gettext('equipment_rating')">
        {{ document.equipment_rating }}
      </span>
      <span v-if="document.exposition_rock_rating" :title="$gettext('exposition_rock_rating')">
        {{ document.exposition_rock_rating }}
      </span>
      <span v-if="document.ice_rating" :title="$gettext('ice_rating')">
        {{ document.ice_rating }}
      </span>
      <span v-if="document.mixed_rating" :title="$gettext('mixed_rating')">
        {{ document.mixed_rating }}
      </span>
      <span v-if="document.ski_rating" :title="$gettext('ski_rating')">
        {{ document.ski_rating }}
      </span>
      <span v-if="document.ski_rating && (document.ski_exposition || document.labande_global_rating)"> / </span>
      <span v-if="document.ski_exposition || document.labande_global_rating">
        <span v-if="document.ski_exposition" :title="$gettext('ski_exposition')">
          {{ document.ski_exposition }}
        </span>
        <span v-if="document.labande_global_rating" :title="$gettext('labande_global_rating')">
          {{ document.labande_global_rating }}
        </span>
      </span>

      <span v-if="document.labande_ski_rating" :title="$gettext('labande_ski_rating')">
        /
        {{ document.labande_ski_rating }}
      </span>
      <span v-if="document.snowshoe_rating" :title="$gettext('snowshoe_rating')">
        {{ document.snowshoe_rating }}
      </span>
      <span v-if="document.hiking_rating" :title="$gettext('hiking_rating')">
        {{ document.hiking_rating }}
      </span>
      <span v-if="document.mtb_up_rating" :title="$gettext('mtb_up_rating')">
        {{ document.mtb_up_rating }}
      </span>
      <span v-if="document.mtb_down_rating" :title="$gettext('mtb_down_rating')">
        {{ document.mtb_down_rating }}
      </span>
      <span v-if="document.hiking_mtb_exposition" :title="$gettext('hiking_mtb_exposition')">
        {{ document.hiking_mtb_exposition }}
      </span>
      <fa-icon v-if="showHelper" icon="info-circle" class="marker-helper has-text-info no-print" />
    </span>

    <router-link
      v-for="rating of showHelper ? displayed_ratings : []"
      :key="rating"
      :to="getHelperLink(fields[rating].helper)"
      class="dropdown-item"
    >
      <div style="width: 2em; display: inline-block" class="has-text-weight-bold">
        {{ document[rating] }}
      </div>
      <span>
        {{ $gettext(rating) }}
      </span>
    </router-link>
  </component>
</template>

<script>
import constants from '@/js/constants';
import { requireDocumentProperty } from '@/js/properties-mixins';

export default {
  mixins: [requireDocumentProperty],

  props: {
    showHelper: {
      type: Boolean,
      default: false,
    },
  },

  ratings: [
    'global_rating',
    'via_ferrata_rating',
    'rock_free_rating',
    'rock_required_rating',
    'aid_rating',
    'engagement_rating',
    'risk_rating',
    'equipment_rating',
    'exposition_rock_rating',
    'ice_rating',
    'mixed_rating',
    'ski_rating',
    'ski_exposition',
    'labande_global_rating',
    'labande_ski_rating',
    'snowshoe_rating',
    'hiking_rating',
    'mtb_up_rating',
    'mtb_down_rating',
    'hiking_mtb_exposition',
  ],

  computed: {
    fields() {
      return constants.objectDefinitions[this.documentType].fields;
    },

    displayed_ratings() {
      const result = [];

      for (const rating of this.$options.ratings) {
        if (this.document[rating]) {
          result.push(rating);
        }
      }

      return result;
    },
  },

  methods: {
    getHelperLink(helper) {
      const items = helper.split('#');

      return {
        name: 'article',
        hash: `#${items[1]}`,
        params: {
          id: parseInt(items[0]),
        },
      };
    },
	formatBoulderRating(rating) {
		if (this.document.climbing_outdoor_type !== 'bloc') return rating;

		return rating.toUpperCase();
	},
  },
};
</script>
