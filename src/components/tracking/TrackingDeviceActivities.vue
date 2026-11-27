<template>
  <div v-if="activities.length">
    <p v-translate>Select an activity to load geographical data into document.</p>
    <div class="mt-2">
      <div class="activities-list columns is-multiline">
        <div v-for="activity in activities" :key="activity.id">
          <div class="column is-flex is-justify-content-space-around">
            <tracking-device-activity :activity="activity">
              <button class="button" @click="fetch(activity)" v-if="!fetching">
                <fa-icon icon="download"></fa-icon>&hairsp;<span v-translate>Use track</span>
              </button>
              <spinner-icon v-else-if="fetching === activity.id" />
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
  <div v-else-if="loading"><span v-translate>Loading...</span></div>
  <div v-else>
    <span v-translate>No activity found</span>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';

import TrackingDeviceActivity from '@/components/tracking/TrackingDeviceActivity.vue';
import trackingService, { type Activity } from '@/js/apis/tracking-service';
import { useGlobalProperties } from '@/js/composables/global-properties';
import { toast } from '@/js/toast';

const emit = defineEmits(['geojson']);

const { $gettext, $user } = useGlobalProperties();

const loading = ref(true);
const activities = ref<Activity[]>([]);
const fetching = ref<number | null>(null);

function loadActivities() {
  trackingService
    .getActivities($user.id!, $user.lang)
    .then(
      (response) => {
        activities.value = response.data;
      },
      () => undefined
    )
    // also when they could not be loaded: "No activity found" then, not loading forever
    .finally(() => (loading.value = false));
}

function fetch(activity: Activity) {
  fetching.value = activity.id;
  trackingService
    .getActivityGeometry($user.id!, activity.id)
    .then(
      ({ data }) => {
        emit('geojson', data, activity.c2cActivities ?? []);
      },
      () => {
        toast({
          message: $gettext('Geographical data could not be retrieved'),
          type: 'is-danger',
          position: 'center',
        });
      }
    )
    .finally(() => (fetching.value = null));
}

onMounted(loadActivities);
</script>
