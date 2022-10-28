<template>
  <p v-translate>Please wait. Requesting authorization...</p>
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
          this.$router.push({ name: 'external-services' });
        },
        (error) => {
          this.$router.push({ name: 'external-services', params: { error: error?.response?.data ?? 'unknown' } });
        }
      );
    },
  },
};
</script>
