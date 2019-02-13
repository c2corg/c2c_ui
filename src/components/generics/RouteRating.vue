<template>
  <span>
    <span v-if="document.global_rating" :title="$gettext('global_rating')">
      {{ document.global_rating }}
    </span>

    <span>
      <span v-if="document.rock_free_rating" :title="$gettext('rock_free_rating')">
        {{ document.rock_free_rating }}<!--
            --></span><!--
            --><span v-if="document.rock_required_rating" :title="$gettext('rock_required_rating')"><!--
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
    <span v-if="document.ski_rating && (document.ski_exposition || document.labande_global_rating)">
      /
    </span>
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
  </span>

</template>

<script>
  import { requireDocumentProperty } from '@/js/properties-mixins';

  export default {
    mixins: [ requireDocumentProperty ]
  };
</script>
