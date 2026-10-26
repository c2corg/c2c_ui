<template>
  <span>
    <button @click="toggleMask" class="button is-small is-ghost">
      <!-- $gettext('Masked') -->
      <!-- $gettext('Visible') -->
      <fa-icon :icon="masked ? 'eye-slash' : 'eye'" :title="$gettext(masked ? 'Masked' : 'Visible')" />
    </button>
  </span>
</template>

<script setup lang="ts">
import { toast } from 'bulma-toast';
import { computed } from 'vue';

import c2c from '@/js/apis/c2c';
import { useGlobalProperties } from '@/js/composables/global-properties';

const props = defineProps({
  version: {
    type: Object,
    required: true,
  },
  lang: {
    type: String,
    required: true,
  },
  id: {
    type: Number,
    required: true,
  },
});

const { $gettext } = useGlobalProperties();

const masked = computed(() => props.version.masked);

async function toggleMask() {
  const version = props.version;
  try {
    await (version.masked
      ? c2c.moderator.unmaskVersion(props.id, props.lang, version.version_id)
      : c2c.moderator.maskVersion(props.id, props.lang, version.version_id));
    // the version object belongs to the parent, which shows it too
    version.masked = !version.masked;
  } catch {
    toast({
      message: $gettext(`An error occurred, couldn't (un)mask version`),
      type: 'is-danger',
    });
  }
}
</script>
