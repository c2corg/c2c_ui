<template>
  <div class="activity" :class="{ hovered: hover }" @mouseover="hover = true" @mouseleave="hover = false">
    <img :src="activity.miniature ? `${miniaturesBaseUrl}/${activity.miniature}` : '/img/broken_image.png'" />
    <div class="activity-top px-2">
      <div class="is-flex is-justify-content-space-between is-size-7 is-italic">
        <div>{{ activity.type[$user.lang] }}</div>
        <div class="has-text-right">{{ $dateUtils.toTechnicalString(activity.date) }}</div>
      </div>
      <div v-if="activity.name">{{ activity.name }}</div>
    </div>
    <div class="activity-bottom is-size-7 is-italic px-2">
      <div class="activity-sources">
        <template v-for="(source, i) in sources" :key="source.vendor">
          <template v-if="i > 0">&#32;·</template>
          <a v-if="vendorUrl(source)" :href="vendorUrl(source)">{{ $gettext(source.vendor) }}</a>
          <template v-else>{{ $gettext(source.vendor) }}</template><span
            v-if="source.deviceName"
            class="activity-device-name"
            :title="source.deviceName"
            >&#32;({{ source.deviceName }})</span
          >
        </template>
      </div>
      <div class="is-flex is-justify-content-space-between">
        <div v-if="duration" class="stat">
          <span role="img" :title="$gettext('Duration')" :aria-label="$gettext('Duration')"
            ><fa-icon :icon="['far', 'clock']"
          /></span>
          <span v-html="duration"></span>
        </div>
        <div v-if="length" class="stat">
          <span role="img" :title="$gettext('length')" :aria-label="$gettext('length')"><fa-icon icon="ruler" /></span>
          <span v-html="length"></span>
        </div>
        <div v-if="heightDiffUp" class="stat"><icon-height-diff-up /><span v-html="heightDiffUp"></span></div>
      </div>
    </div>
    <div class="activity-center" v-show="hover">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

import { distinctDeviceName } from './activity-device';

import type { ActivitySource } from '@/js/apis/tracking-service';
import { useGlobalProperties } from '@/js/composables/global-properties';
import config from '@/js/config';

const props = defineProps({
  activity: {
    type: Object,
    required: true,
  },
});

const { $dateUtils, $documentUtils, $gettext } = useGlobalProperties();

const hover = ref(false);
const miniaturesBaseUrl = config.urls.miniatures;

const duration = computed(() =>
  props.activity.duration ? $dateUtils.durationToTimeString(props.activity.duration) : undefined
);
const heightDiffUp = computed(() => $documentUtils.heightDiffUpWithUnit(props.activity.heightDiffUp));
const length = computed(() => $documentUtils.lengthWithUnit(props.activity.length));

// the vendors that have this outing (tracking before 3.4.0 sends none)
const sources = computed<ActivitySource[]>(() =>
  (props.activity.sources ?? [props.activity as ActivitySource]).map((source) => ({
    ...source,
    deviceName: distinctDeviceName(source.deviceName, source.vendor, $gettext(source.vendor)),
  }))
);

const vendorUrl = ({ vendor, vendorId }: ActivitySource): string | undefined => {
  switch (vendor) {
    case 'strava':
      return `https://www.strava.com/activities/${vendorId}`;
    case 'garmin':
      return `https://connect.garmin.com/modern/activity/${vendorId}`;
    default:
      return undefined;
  }
};
</script>

<style scoped>
.activity {
  width: 200px;
  height: 200px;
  position: relative;
  background-color: var(--c2c-white-ter);

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
  background-color: rgba(0, 0, 0, 0.55);
  color: white;
}

.activity-bottom {
  bottom: 0;
}

.activity-device-name {
  display: inline-block;
  max-width: 12em;
  overflow: hidden;
  text-overflow: ellipsis;
  vertical-align: bottom;
  white-space: nowrap;
}

.stat {
  display: inline-flex;
  align-items: center;
  gap: 0.3em;
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

  :slotted(button) {
    pointer-events: auto;
  }
}
</style>
