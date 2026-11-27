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

<script setup lang="ts">
import { useGlobalProperties } from '@/js/composables/global-properties';

const currentYear = useGlobalProperties().$dateUtils.toLocalizedString(new Date(), 'YYYY');
</script>
