<template>
  <span>
    <span v-if="document.global_rating" :title="$gettext('global_rating')">
      {{ document.global_rating }}
    </span>

    <span v-if="document.via_ferrata_rating" :title="$gettext('via_ferrata_rating')">
      {{ document.via_ferrata_rating }}
    </span>

    <span>
      <span v-if="document.rock_free_rating" :title="$gettext('rock_free_rating')">
        {{ rockFreeRating }}<!--
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
    <slot />
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';
// The ratings of a document, as one line: shown by DocumentRating, alone or as the button of its helper dropdown

const props = defineProps({
  document: {
    type: Object,
    required: true,
  },
});

const rockFreeRating = computed(() => {
  const rating = props.document.rock_free_rating;
  if (props.document.climbing_outdoor_type !== 'bloc') return rating;
  return rating.toUpperCase();
});
</script>
