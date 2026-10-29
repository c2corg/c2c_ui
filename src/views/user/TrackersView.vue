<template>
  <div class="section">
    <html-header :title="$gettext('Activity trackers')" />

    <h1 class="title is-1" v-translate>Configure activity trackers</h1>
    <p class="mb-4" v-translate>
      Configure your connection to external services like Strava or your GPS device application to easily retrieve
      geometries.
    </p>

    <h2 class="title is-2" v-translate>Applications</h2>

    <div v-if="statusError" class="notification is-danger">
      <span v-translate>An error occurred, connection status could not be retrieved. Please refresh the page.</span>
    </div>
    <div class="columns is-multiline">
      <div class="column is-4" v-for="application in filteredApplications" :key="application.name">
        <application-card
          :application="application"
          @configure="configure(application.name)"
          @revoke="revoke(application.name)"
        ></application-card>
      </div>
    </div>

    <h2 class="title is-2">Outdoorvision</h2>

    <div class="columns">
      <div class="column is-3">
        <a href="https://outdoorvision.fr/" rel="noreferrer noopener">
          <img src="@/assets/img/outdoorvision.svg" loading="lazy" />
        </a>
      </div>
      <div class="column is-9">
        <p class="m-4" v-translate>
          Let's preserve our playground! I create an account on Outdoorvision to share my GPS tracks for the
          preservation and design of my practice sites in France.
        </p>
        <div class="has-text-centered">
          <a
            href="https://outdoorvision.fr/?mtm_campaign=CampToCamp"
            rel="noreferrer noopener"
            class="button is-primary"
            v-translate
          >
            I contribute
          </a>
        </div>
      </div>
      .
    </div>

    <h2 class="title is-2" v-translate>Last activities</h2>
    <template v-if="activities.length">
      <div v-for="activity in activities" :key="activity.id">
        {{ $dateUtils.toTechnicalString(activity.date) }}&hairsp;&bull;&hairsp;<template v-if="activity.name"
          >{{ activity.name }}&hairsp;&bull;&hairsp;</template
        >{{ activity.type[$user.lang] }}&hairsp;&bull;&hairsp;{{ $gettext(activity.vendor)
        }}<template v-if="activity.duration"
          >&hairsp;&bull;&hairsp;<span role="img" :title="$gettext('Duration')" :aria-label="$gettext('Duration')"
            ><fa-icon :icon="['far', 'clock']" /></span
          >&hairsp;<span v-html="activity.duration"></span></template
        ><template v-if="activity.length">
          &hairsp;&bull;&hairsp;<span role="img" :title="$gettext('length')" :aria-label="$gettext('length')"
            ><fa-icon icon="ruler" /></span
          >&hairsp;<span v-html="activity.length"></span></template
        ><template v-if="activity.heightDiffUp"
          >&hairsp;&bull;&hairsp;<icon-height-diff-up />&hairsp;<span v-html="activity.heightDiffUp"></span
        ></template>
      </div>
    </template>
    <div v-else-if="activitiesLoading"><spinner-icon /></div>
    <div v-else-if="activitiesError">
      <span v-translate>An error occurred, could not retrieve activities</span>
    </div>
    <div v-else v-translate>No activity retrieved yet. Have you connected your trackers?</div>
  </div>
</template>

<script setup lang="ts">
import { toast } from 'bulma-toast';
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';

import ApplicationCard from '@/components/tracking/ApplicationCard.vue';
import trackingService, { type Activity, type Status, type Vendor } from '@/js/apis/tracking-service';
import { useGlobalProperties } from '@/js/composables/global-properties';
import config from '@/js/config';

// an activity tracker, and whether the user configured it
type Application = { name: Vendor; website: string; connect?: string; status: Status | 'disabled' };
// an activity as shown: duration, length and height difference formatted
type ShownActivity = Omit<Activity, 'duration' | 'length' | 'heightDiffUp'> & {
  duration?: number | string;
  length?: number | string;
  heightDiffUp?: number | string;
};

const route = useRoute();
const { $gettext, $user, $dateUtils, $documentUtils } = useGlobalProperties();

const baseUrl = window.location.origin;

const activitiesLoading = ref<boolean | null>(null);
const activitiesError = ref(false);
const activities = ref<ShownActivity[]>([]);
const statusError = ref(false);
const applications = ref<Application[]>([
  {
    // $gettext('strava')
    name: 'strava',
    website: 'https://www.strava.com',
    connect: `${config.urls.stravaConnectAuthUrl}?client_id=${config.urls.stravaClientId}&response_type=code&approval_prompt=force&scope=activity:read,activity:read_all&redirect_uri=${baseUrl}/trackers/strava/exchange-token`,
    status: 'disabled',
  },
  {
    // $gettext('coros')
    name: 'coros',
    website: 'https://coros.com/traininghub',
    connect: `${config.urls.corosConnectAuthUrl}?client_id=${config.urls.corosClientId}&redirect_uri=${baseUrl}/trackers/coros/exchange-token&response_type=code`,
    status: 'disabled',
  },
  {
    // $gettext('decathlon')
    name: 'decathlon',
    website: 'https://developers.decathlon.com/products/sports-tracking-data',
    connect: `${config.urls.decathlonConnectAuthUrl}?client_id=${config.urls.decathlonClientId}&response_type=code&redirect_uri=${baseUrl}/trackers/decathlon/exchange-token&state=c2c`,
    status: 'disabled',
  },
  {
    // $gettext('garmin')
    name: 'garmin',
    website: 'https://www.garmin.com/',
    status: 'disabled',
  },
  {
    // $gettext('polar')
    name: 'polar',
    website: 'https://flow.polar.com/',
    connect: `${config.urls.polarConnectAuthUrl}?response_type=code&client_id=${config.urls.polarClientId}&redirect_uri=${baseUrl}/trackers/polar/exchange-token`,
    status: 'disabled',
  },
  {
    // $gettext('suunto')
    name: 'suunto',
    website: 'https://app.suunto.com/',
    connect: `${config.urls.suuntoConnectAuthUrl}?client_id=${config.urls.suuntoClientId}&response_type=code&redirect_uri=${baseUrl}/trackers/suunto/exchange-token&state=c2c`,
    status: 'disabled',
  },
]);

const filteredApplications = computed(() => applications.value.filter(({ status }) => status !== 'disabled'));

function load() {
  loadActivities();
  const error = route.query['error'];
  if (error) {
    // $gettext('auth-denied', 'tracking')
    // $gettext('unsufficient-scopes', 'tracking')
    // $gettext('setup-failed', 'tracking')
    // $gettext('unknown', 'tracking')
    toast({ message: $gettext(String(error), 'tracking'), type: 'is-danger', position: 'center' });
  }
}

function loadActivities() {
  statusError.value = false;
  activitiesError.value = false;
  trackingService.getStatus($user.id!).then(
    ({ data }) => {
      Object.entries(data).map(([app, status]) => {
        const idx = applications.value.findIndex(({ name }) => name === app);
        applications.value.splice(idx, 1, { ...applications.value[idx], status: status! });
      });
      activitiesLoading.value = true;
      activitiesError.value = false;
      activities.value = [];
      trackingService.getActivities($user.id!, $user.lang ?? undefined).then(
        ({ data }) => {
          activitiesLoading.value = false;
          activities.value = data.slice(0, 5).map((activity) => ({
            ...activity,
            ...(activity.duration && { duration: $dateUtils.durationToTimeString(activity.duration) }),
            ...(activity.heightDiffUp && {
              heightDiffUp: $documentUtils.heightDiffUpWithUnit(activity.heightDiffUp),
            }),
            ...(activity.length && { length: $documentUtils.lengthWithUnit(activity.length) }),
          }));
        },
        () => {
          activitiesLoading.value = false;
          activitiesError.value = true;
        }
      );
    },
    () => {
      statusError.value = true;
    }
  );
}

function configure(vendor: Vendor) {
  if (vendor === 'garmin') {
    configureGarmin();
  } else {
    window.location.href = applications.value.find(({ name }) => vendor === name)!.connect!;
  }
}

function configureGarmin() {
  trackingService.requestGarminUnauthorizeRequestToken($user.id!).then(
    ({ data }) => {
      const token = data.token;
      window.location.href = `https://connect.garmin.com/oauthConfirm?oauth_token=${token}&oauth_callback=${baseUrl}/trackers/garmin/exchange-token`;
    },
    () => {
      toast({ message: $gettext('setup-failed', 'tracking'), type: 'is-danger', position: 'center' });
    }
  );
}

function revoke(vendor: Vendor) {
  trackingService
    .deauthorize(vendor, $user.id!)
    .then(() => {
      toast({ message: $gettext('Subcription revoked'), type: 'is-primary', position: 'top-center' });
      loadActivities(); // async
    })
    .catch(() => {
      toast({ message: $gettext('Subcription revokal failed'), type: 'is-danger', position: 'top-center' });
    });
}

onMounted(load);
</script>

<style scoped lang="scss">
.title.is-2 {
  border-bottom: 1px solid #ddd;
}
</style>
