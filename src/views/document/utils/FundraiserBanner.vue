<template>
  <div v-if="fundraiser" class="notification is-info is-light no-print fundraiser-banner">
    <fa-icon :icon="['miscs', 'drill']" class="fundraiser-icon has-text-danger" fixed-width />
    <span class="fundraiser-message">{{ message }}</span>
    <a :href="fundraiser.url" target="_blank" rel="noopener" class="button is-small is-info">
      <span v-translate>Contribute to maintainance</span>
    </a>
  </div>
</template>

<script>
import getFundraiser from '@/js/get-fundraiser';

export default {
  props: {
    document: {
      type: Object,
      required: true,
    },
  },

  computed: {
    fundraiser() {
      return getFundraiser(this.document);
    },

    message() {
      return this.fundraiser?.message
        ? this.$gettext(this.fundraiser.message)
        : this.$gettext('This site is maintained by local actors. Support them to help keep it open!');
    },
  },
};
</script>

<style scoped>
.fundraiser-banner {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.fundraiser-icon {
  font-size: 1.5rem;
}

.fundraiser-message {
  flex: 1;
}
</style>
