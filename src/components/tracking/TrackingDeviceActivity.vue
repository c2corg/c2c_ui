<template>
  <div class="activity" :class="{ hovered: hover }" @mouseover="hover = true" @mouseleave="hover = false">
    <img :src="activity.miniature ? `${miniaturesBaseUrl}/${activity.miniature}` : '/img/broken_image.png'" />
    <div class="activity-top px-2">
      <div class="is-flex is-justify-content-space-between is-size-7 is-italic">
        <div>{{ activity.type[$user.lang] }}</div>
        <div class="has-text-right">{{ $dateUtils.toTechnicalString(activity.date) }}</div>
      </div>
      <div>
        <span v-if="activity.name">{{ activity.name }}&nbsp;</span>
        <span :class="{ 'is-size-7 is-italic': activity.name }">
          <a v-if="activity.vendor === 'strava'" :href="'https://www.strava.com/activities/' + activity.vendorId">{{
            $gettext(activity.vendor)
          }}</a>
          <a
            v-else-if="activity.vendor === 'garmin'"
            :href="'https://connect.garmin.com/modern/activity/' + activity.vendorId"
            >{{ $gettext(activity.vendor) }}</a
          >
          <template v-else>{{ $gettext(activity.vendor) }}</template>
        </span>
      </div>
    </div>
    <div class="activity-bottom is-flex is-justify-content-space-between is-size-7 is-italic px-2">
      <div v-if="duration">
        <span role="img" :title="$gettext('Duration')" :aria-label="$gettext('Duration')"
          ><fa-icon :icon="['far', 'clock']" /></span
        >&hairsp;<span v-html="duration"></span>
      </div>
      <div v-if="length">
        <span role="img" :title="$gettext('length')" :aria-label="$gettext('length')"><fa-icon icon="ruler" /></span
        >&hairsp;<span v-html="length"></span>&nbsp;
      </div>
      <div v-if="heightDiffUp"><icon-height-diff-up />&hairsp;<span v-html="heightDiffUp"></span></div>
    </div>
    <div class="activity-center" v-show="hover">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

import { useGlobalProperties } from '@/js/composables/global-properties';
import config from '@/js/config';

const props = defineProps({
  activity: {
    type: Object,
    required: true,
  },
});

const { $dateUtils, $documentUtils } = useGlobalProperties();

const hover = ref(false);
const miniaturesBaseUrl = config.urls.miniatures;

const duration = computed(() =>
  props.activity.duration ? $dateUtils.durationToTimeString(props.activity.duration) : undefined
);
const heightDiffUp = computed(() => $documentUtils.heightDiffUpWithUnit(props.activity.heightDiffUp));
const length = computed(() => $documentUtils.lengthWithUnit(props.activity.length));
</script>

<style lang="scss" scoped>
$size: 200px;

.activity {
  width: $size;
  height: $size;
  position: relative;
  background-color: $white-ter;

  &.hovered > img {
    filter: brightness(80%);
  }
}

a {
  color: white;

  &:hover {
    filter: brightness(80%);
  }
}

.activity-top,
.activity-bottom {
  position: absolute;
  width: 100%;
  left: 0;
  background-color: rgba($color: #000, $alpha: 0.55);
  color: white;
}

.activity-bottom {
  bottom: 0;
}

.activity-top {
  top: 0;
}

.activity-center {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  pointer-events: none;

  button {
    pointer-events: auto;
  }
}
</style>
