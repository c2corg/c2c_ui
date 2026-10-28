<template>
  <p class="m-4"><spinner-icon /><span v-translate>Please wait. Requesting authorization...</span></p>
</template>

<script setup lang="ts">
import { watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import trackingService, { type Vendor } from '@/js/apis/tracking-service';
import { useGlobalProperties } from '@/js/composables/global-properties';

const route = useRoute();
const router = useRouter();
const { $user } = useGlobalProperties();

function exchangeToken() {
  trackingService.exchangeToken(route.params.vendor as Vendor, $user.id!, route.query).then(
    () => {
      router.push({ name: 'trackers' });
    },
    (error: { response?: { data?: unknown } }) => {
      router.push({ name: 'trackers', params: { error: (error?.response?.data as string | undefined) ?? 'unknown' } });
    }
  );
}

// on each route change, as the $route watcher did
watch(() => route.fullPath, exchangeToken, { immediate: true });
</script>
