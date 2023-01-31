<template>
  <card-container :document="document" :target="target" :highlighted="highlighted">
    <card-title>
      <document-title :document="document" class="is-ellipsed-tablet" />
      <marker-condition :condition="document.condition_rating" class="is-pulled-right" />
    </card-title>

    <card-row>
      <card-region-item :document="document" />

      <span class="is-nowrap">
        <fa-icon class="card-icon" icon="pen" />
        <span> {{ document.author.name | uppercaseFirstLetter }}</span>
      </span>
    </card-row>

    <card-row>
      <span>
        <icon-ratings class="card-icon" />
        <document-rating :document="document" />
      </span>

      <card-elevation-item :elevation="document.elevation_max" class="is-ellipsed" />

      <span v-if="document.height_diff_up" :title="$gettext('height_diff_up')">
        <icon-height-diff-up class="card-icon" />
        {{ document.height_diff_up }}&nbsp;m
      </span>
      <span v-else />
    </card-row>

    <card-row>
      <card-activities-item :activities="document.activities" />

      <span class="card-icon is-nowrap">
        <marker-soft-mobility v-if="document.public_transport" />
        &nbsp;
        <marker-gps-trace v-if="document.geometry.has_geom_detail" />
        &nbsp;
        <marker-image-count :image-count="document.img_count" />
      </span>

      <span class="is-nowrap">
        {{ $dateUtils.toLocalizedString(document.date_end, 'll') }}
      </span>

      <marker-quality :quality="document.quality" />
    </card-row>
  </card-container>
</template>

<script>
import { documentCardMixin } from './utils/mixins';

export default {
  mixins: [documentCardMixin],
};
</script>
