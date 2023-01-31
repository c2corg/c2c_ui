<template>
  <div>
    {{ $dateUtils.toTechnicalString(activity.date) }}&hairsp;&bull;&hairsp;<template v-if="activity.name"
      ><a v-if="activity.vendor === 'strava'" :href="'https://www.strava.com/activities/' + activity.vendorId">{{
        activity.name
      }}</a
      ><a
        v-else-if="activity.vendor === 'garmin'"
        :href="'https://connect.garmin.com/modern/activity/' + activity.vendorId"
        >{{ activity.name }}</a
      ><template v-else>{{ activity.name }}</template
      >&hairsp;&bull;&hairsp;</template
    ><template v-if="duration || length || heightDiffUp"
      ><template v-if="duration"
        ><fa-icon :icon="['far', 'clock']" :title="$gettext('Duration')"></fa-icon>&hairsp;<span
          v-html="duration"
        ></span
        >&nbsp;</template
      ><template v-if="length"
        ><fa-icon icon="ruler" :title="$gettext('length')"></fa-icon>&hairsp;<span v-html="length"></span
        >&nbsp;</template
      ><template v-if="heightDiffUp"
        ><icon-height-diff-up></icon-height-diff-up>&hairsp;<span v-html="heightDiffUp"></span></template
      >&hairsp;&bull;&hairsp;</template
    >{{ activity.type[$user.lang] }}&hairsp;&bull;&hairsp;{{ $gettext(activity.vendor) }}
  </div>
</template>

<script>
export default {
  props: {
    activity: {
      type: Object,
      required: true,
    },
  },

  computed: {
    duration() {
      if (!this.activity.duration) {
        return undefined;
      }
      return this.$dateUtils.durationToTimeString(this.activity.duration);
    },

    heightDiffUp() {
      if (!this.activity.heightDiffUp) {
        return undefined;
      }
      return `${this.activity.heightDiffUp}&nbsp;${this.$gettext('meters')}`;
    },

    length() {
      if (!this.activity.length) {
        return undefined;
      }
      if (this.activity.length > 1000) {
        const length = (this.activity.length / 1000.0).toFixed(1);
        return `${length}&nbsp;${this.$gettext('kilometers')}`;
      }
      return `${this.activity.length}&nbsp;${this.$gettext('meters')}`;
    },
  },
};
</script>
