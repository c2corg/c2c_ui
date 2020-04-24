<template>
  <label-value :label="$gettext('activities')">
    <activities :activities="activities" class="is-size-3 has-text-secondary" />
  </label-value>
</template>

<script>
  import { requireDocumentProperty } from '@/js/properties-mixins';

  import LabelValue from './LabelValue';

  export default {
    components: { LabelValue },
    mixins: [requireDocumentProperty],
    props: {
      single: {
        type: Boolean,
        default: false
      }
    },
    computed: {
      activities() {
        if (!this.single) return this.document.activities;
        const singleActivity = this.document.event_activity;
        if (!singleActivity) return [];
        else if (singleActivity === 'other') return ['other'];
        else if (singleActivity === 'alpine_climbing') return ['mountain_climbing'];
        else if (singleActivity === 'multipitch_climbing') return ['rock_climbing'];
        else if (singleActivity === 'sport_climbing') return ['rock_climbing'];
        else return [singleActivity];
      }
    }
  };

</script>

<style lang="scss" scoped>
@media print {
  .is-size-3{
        font-size: 1rem !important;
  }
}
</style>
