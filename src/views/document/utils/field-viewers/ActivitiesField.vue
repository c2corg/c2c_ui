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
    props: { single : {
      type: Boolean,
      default: false
    }},
    mixins: [requireDocumentProperty],
    computed: {
      activities() {
        if (!this.single) return this.document.activities;
        this.activity = this.document.event_activity;
        if (!this.activity) return [];
        else if (this.activity === 'other') return ['other'];
        else if (this.activity === 'alpine_climbing') return ['mountain_climbing'];
        else if (this.activity === 'multipitch_climbing') return ['rock_climbing'];
        else if (this.activity === 'sport_climbing') return ['rock_climbing'];
        else return ['other'];
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
