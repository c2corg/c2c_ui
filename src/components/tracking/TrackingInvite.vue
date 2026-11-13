<template>
  <p v-if="!dismissed" class="tracking-invite is-size-7">
    <span v-translate>
      Skip the file next time: link your Strava, Garmin, Suunto, Polar, Coros or Decathlon account and pick your outings
      directly, with the activity prefilled.
    </span>
    <!-- in a new tab: the document being edited stays as it is -->
    <router-link :to="{ name: 'trackers' }" target="_blank" class="is-nowrap" v-translate>Link an account</router-link>
    <button type="button" class="delete is-small" :aria-label="$gettext('Close')" @click="dismiss"></button>
  </p>
</template>

<script setup lang="ts">
import { ref } from 'vue';

// the invitation to link a tracking device account, to the users uploading GPS files without one: dismissed for good
const STORAGE_KEY = 'c2c.trackingInviteDismissed';

function read() {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    // no storage (private browsing…): shown again next time
    return false;
  }
}

const dismissed = ref(read());

function dismiss() {
  dismissed.value = true;
  try {
    window.localStorage.setItem(STORAGE_KEY, 'true');
  } catch {
    // dismissed until the page is reloaded only
  }
}
</script>

<style scoped>
/* one flowing line, wrapped on narrow screens */
.tracking-invite a,
.tracking-invite .delete {
  margin-left: 0.5rem;
  vertical-align: middle;
}
</style>
