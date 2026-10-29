<template>
  <div class="column">
    <div class="field">
      <label class="label">
        <span>
          {{ $filters.uppercaseFirstLetter($gettext('quality')) }}
        </span>
        &nbsp;
        <span v-if="!isCollaborative" @click="autoComputeQuality = !autoComputeQuality">
          <fa-icon :icon="autoComputeQuality ? 'lock' : 'unlock'" class="has-cursor-pointer" />
        </span>
      </label>
    </div>
    <div class="field quality-select-container">
      <input-simple
        v-if="autoComputeQuality && !isCollaborative"
        :options="constants.quality_types"
        i18n
        i18n-context="quality_types"
        :model-value="computedQuality"
        disabled
      />
      <input-simple
        v-else
        :options="constants.quality_types"
        i18n
        i18n-context="quality_types"
        required
        v-model="document.quality"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

import constants from '@/js/constants';
import { documentProperty } from '@/js/properties';
import type { C2cDocument } from '@/js/vue-plugins/document-utils';

type Doc = C2cDocument;
// the edited locale, with the fields of its document type
type Locale = Record<string, any>;

function getQualityFromScore(score: number) {
  if (score < 1) {
    return 'empty';
  } else if (score < 2) {
    return 'draft';
  } else if (score < 3) {
    return 'medium';
  } else if (score < 4) {
    return 'fine';
  }
  return 'fine'; // never compute great
}

function hasActivities(doc: Doc, activities: string[]) {
  for (const activity of activities) {
    if (doc.activities.includes(activity)) {
      return true;
    }
  }
  return false;
}

function hasRouteInfo(doc: Doc, locale: Locale) {
  return (doc.geometry && doc.geometry.geom_detail) || locale.route_description;
}

function hasConditionLevel(doc: Doc, locale: Locale) {
  if (locale.conditions) {
    return true;
  }

  if (!locale.conditions_levels) {
    return false;
  }

  const levels = JSON.parse(locale.conditions_levels);

  if (levels && levels.length !== 0) {
    if (
      levels[0].level_place ||
      levels[0].level_comment ||
      levels[0].level_snow_height_total ||
      levels[0].level_snow_height_soft
    ) {
      return true;
    }
  }

  return false;
}

function hasSnowInfo(doc: Doc) {
  return (
    doc.elevation_up_snow ||
    doc.elevation_down_snow ||
    doc.snow_quantity ||
    doc.snow_quality ||
    doc.length_total ||
    doc.glacier_rating
  );
}

function getImageQuality(doc: Doc, locale: Locale) {
  let score = 0;

  score += doc.geometry && doc.geometry.geom ? 1 : 0;
  score += doc.activities && doc.activities.length ? 0.5 : 0;
  score += doc.categories && doc.categories.length ? 0.5 : 0;
  score += doc.associations!.waypoints.length || doc.associations!.routes.length ? 1 : 0;

  score += locale.title ? 1 : 0;
  score += locale.description ? 1 : 0;

  return getQualityFromScore(score);
}

function getArticleQuality(doc: Doc, locale: Locale) {
  const description = locale.description || '';

  let score = 0;

  score += doc.associations!.waypoints.length ? 1 : 0;
  score += doc.associations!.images.length ? 1 : 0;
  score += locale.summary ? 1 : 0;
  score += description ? 1 : -1;
  score += description.search(/(^|\n)##/g) !== -1 ? 1 : 0; // title
  score += description.search(/\[img=/g) !== -1 ? 1 : 0; // img

  return getQualityFromScore(score);
}

function getOutingQuality(doc: Doc, locale: Locale) {
  function getSkiScore() {
    let score = 0;

    score += hasRouteInfo(doc, locale) ? 0.5 : 0;
    score += hasSnowInfo(doc) ? 0.5 : 0;

    if (
      (doc.access_condition && doc.access_condition !== 'snowy' && doc.elevation_access) ||
      (doc.access_condition === 'snowy' && doc.elevation_access && locale.access_comment)
    ) {
      score += 0.5;
    }

    score += doc.avalanche_signs !== 'no' && locale.avalanches ? 0.5 : 0;

    score += locale.description ? 0.5 : 0;
    score += locale.weather ? 0.5 : 0;
    score += doc.condition_rating ? 0.5 : 0;

    score = hasConditionLevel(doc, locale) ? score + 1 : Math.min(score, 2);

    return score;
  }

  function getIceScore() {
    let score = 0;

    score += hasRouteInfo(doc, locale) ? 0.5 : 0;
    score += doc.condition_rating ? 0.5 : 0;
    score += locale.description ? 1 : 0;
    score += locale.timing ? 0.5 : 0;
    score += locale.weather ? 0.5 : 0;
    score = hasConditionLevel(doc, locale) ? score + 1.5 : Math.min(score, 2);

    return score;
  }

  function getClimbingScore() {
    let score = 0;

    score += hasRouteInfo(doc, locale) ? 0.5 : 0;
    score += locale.description ? 1 : 0;
    score += locale.timing ? 0.5 : 0;
    score += locale.weather ? 0.5 : 0;
    score = locale.conditions ? score + 2 : Math.min(score, 2);

    return score;
  }

  let skiScore = 0;
  let iceScore = 0;
  let climbingScore = 0;

  if (hasActivities(doc, ['skitouring', 'snowshoeing'])) {
    skiScore = getSkiScore();
  }

  if (hasActivities(doc, ['snow_ice_mixed', 'ice_climbing', 'mountain_climbing'])) {
    iceScore = getIceScore();
  }

  if (hasActivities(doc, ['rock_climbing', 'hiking', 'mountain_biking', 'via_ferrata', 'paragliding', 'slacklining'])) {
    climbingScore = getClimbingScore();
  }

  const score = Math.max(skiScore, iceScore, climbingScore);
  return getQualityFromScore(score);
}

const props = defineProps({ ...documentProperty });

const autoComputeQuality = ref(true);

// in edit mode, there is only one locale
const editedLocale = computed(() => props.document.locales![0]);

const isCollaborative = computed(() => {
  const document = props.document;

  if (['a', 'b', 'w', 'r', 'm'].includes(document.type!)) {
    return true;
  }
  if (['u', 'o', 'x'].includes(document.type!)) {
    return false;
  }
  if (['i'].includes(document.type!)) {
    return document.image_type === 'collaborative';
  }
  if (['c'].includes(document.type!)) {
    return document.article_type === 'collab';
  }

  return false;
});

const computedQuality = computed(() => {
  const document = props.document;

  // "great is never proposed by the computation. When current quality is
  // "great", it's because it has been explicitly set => do not change it
  if (document.quality === 'great') {
    return 'great';
  }

  if (document.type === 'o') {
    return getOutingQuality(document, editedLocale.value);
  } else if (document.type === 'c') {
    return getArticleQuality(document, editedLocale.value);
  } else if (document.type === 'i') {
    return getImageQuality(document, editedLocale.value);
  }

  return document.quality as string;
});

// will be called by parent component before saving document
function beforeSave() {
  if (!isCollaborative.value && autoComputeQuality.value) {
    props.document.quality = computedQuality.value;
  }
}

defineExpose({ beforeSave });
</script>
<style lang="scss" scoped>
.quality-select-container {
  max-width: 20rem;
}
</style>
