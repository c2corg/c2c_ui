<template>
  <!-- the plain span can't receive named slots: the ratings are its children, not a #button slot -->
  <dropdown-button v-if="showHelper">
    <template #button>
      <document-rating-values :document="document">
        <fa-icon icon="info-circle" class="marker-helper has-text-info no-print" />
      </document-rating-values>
    </template>

    <router-link
      v-for="rating of displayed_ratings"
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
  </dropdown-button>
  <span v-else>
    <document-rating-values :document="document" />
  </span>
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
  },
};
</script>
