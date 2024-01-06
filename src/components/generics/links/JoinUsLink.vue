<template>
  <span>
    <a
      :href="
        'https://www.helloasso.com/associations/camptocamp-association/adhesions/adhesions-' +
        currentYear +
        '-camptocamp-association'
      "
      :title="$gettext('Join us')"
    >
      <slot />
    </a>
  </span>
</template>

<script>
export default {
  data() {
    return {
      currentYear: this.getCurrentYearString(),
    };
  },

  methods: {
    getCurrentYearString() {
      return this.$dateUtils.toLocalizedString(new Date(), 'YYYY');
    },
  },
};
</script>
