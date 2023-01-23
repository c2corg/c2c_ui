<template>
  <div v-if="activities.length">
    <p v-translate>Select an activity to load geographical data into document.</p>
    <div class="mt-2">
      <div class="activities-list columns is-multiline">
        <div v-for="activity in activities" :key="activity.id">
          <div class="column is-flex is-justify-content-space-around">
            <tracking-device-activity :activity="activity">
              <button class="button" @click="fetch(activity.id)" v-if="!fetching">
                <fa-icon icon="download"></fa-icon>&hairsp;<span v-translate>Use track</span>
              </button>
              <span v-else-if="fetching === activity.id"><fa-icon icon="rotate" spin></fa-icon></span>
            </tracking-device-activity>
          </div>
        </div>
      </div>
      <p>
        <span v-translate>Static map images</span> © <a href="https://www.mapbox.com/about/maps/">Mapbox</a> ©
        <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>
      </p>
    </div>
  </div>
  <div v-else-if="promise !== null"><span v-translate>Loading...</span></div>
  <div v-else>
    <span v-translate>No activity found</span>
  </div>
</template>

<script>
import { toast } from 'bulma-toast';

import TrackingDeviceActivity from '@/components/tracking/TrackingDeviceActivity';
import trackingService from '@/js/apis/tracking-service';

export default {
  components: { TrackingDeviceActivity },

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
