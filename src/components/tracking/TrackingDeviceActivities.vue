<template>
  <div v-if="activities.length">
    <p v-translate>Select an activity to load geographical data into document.</p>
    <div class="mt-2">
      <div v-for="activity in activities" :key="activity.id" class="has-hover-background activity-row">
        <div>
          <a @click="fetch(activity.id)" v-if="!fetching"
            ><fa-icon icon="download" :title="$gettext('Fetch geographic data')"></fa-icon></a
          ><span v-else-if="fetching === activity.id" class="has-text-link"><fa-icon icon="rotate" spin></fa-icon></span
          ><span v-else class="has-text-grey-light"><fa-icon icon="download"></fa-icon></span>
        </div>
        <device-activity-row :activity="activity"></device-activity-row>
      </div>
    </div>
  </div>
  <div v-else-if="promise !== null"><span v-translate>Loading...</span></div>
  <div v-else>
    <span v-translate>No activity found</span>
  </div>
</template>

<script>
import { toast } from 'bulma-toast';

import DeviceActivityRow from '@/components/tracking/DeviceActivityRow';
import trackingService from '@/js/apis/tracking-service';

export default {
  components: { DeviceActivityRow },

  data() {
    return {
      promise: null,
      activities: [],
      fetching: null,
    };
  },

  mounted() {
    this.loadActivities();
  },

  methods: {
    async loadActivities() {
      if (this.promise) {
        this.promise.cancel();
      }
      this.promise = trackingService.getActivities(this.$user.id, this.$user.lang).then((response) => {
        this.activities = response.data;
      });
    },

    fetch(activityId) {
      this.fetching = activityId;
      trackingService
        .getActivityGeometry(this.$user.id, activityId)
        .then(
          ({ data }) => {
            this.$emit('geojson', data);
          },
          () => {
            toast({
              message: this.$gettext('Geographical data could not be retrieved'),
              type: 'is-danger',
              position: 'center',
            });
          }
        )
        .finally(() => (this.fetching = null));
    },
  },
};
</script>

<style scoped lang="scss">
.activity-row {
  display: flex;
  gap: 5px;
}
</style>
