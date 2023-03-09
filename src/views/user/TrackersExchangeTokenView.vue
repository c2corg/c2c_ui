<template>
  <p class="m-4"><spinner-icon /><span v-translate>Please wait. Requesting authorization...</span></p>
</template>

<script>
import trackingService from '@/js/apis/tracking-service';

export default {
  watch: {
    $route: {
      handler: 'exchangeToken',
      immediate: true,
    },
  },

  methods: {
    exchangeToken() {
      trackingService.exchangeToken(this.$route.params.vendor, this.$user.id, this.$route.query).then(
        () => {
          this.$router.push({ name: 'trackers' });
        },
        (error) => {
          this.$router.push({ name: 'trackers', params: { error: error?.response?.data ?? 'unknown' } });
        }
      );
    },
  },
};
</script>
