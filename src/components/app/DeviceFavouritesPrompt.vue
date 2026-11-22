<template>
  <!-- after signing in: the favourites saved on this device logged out are nobody's, on a computer maybe shared -->
  <modal-card ref="dialog" @hide="dismissed = !busy">
    <template #title>{{ $gettext('Favourites saved on this device') }}</template>
    <p>{{ $gettext('These favourites were saved on this device while logged out. Add them to your account?') }}</p>
    <ul class="device-favourites">
      <li v-for="entry of shown" :key="entry.type + entry.id">
        <fa-icon v-if="entry.mode === 'offline'" icon="arrow-down" :title="$gettext('Saved offline')" />
        {{ entry.title || '#' + entry.id }}
      </li>
      <li v-if="more" class="has-text-grey">+ {{ more }}</li>
    </ul>
    <p class="is-size-7 has-text-grey">
      {{ $gettext('Kept on this device, they stay visible to anyone logged out.') }}
    </p>
    <template #footer>
      <button type="button" class="button is-primary" :class="{ 'is-loading': busy }" :disabled="busy" @click="add">
        {{ $gettext('Add to my favourites') }}
      </button>
      <button type="button" class="button" :disabled="busy" @click="keep">
        {{ $gettext('Keep on this device') }}
      </button>
    </template>
  </modal-card>
</template>

<script setup lang="ts">
import { computed, ref, useTemplateRef, watch } from 'vue';

import ModalCard from '@/components/generics/modals/ModalCard.vue';
import { useGlobalProperties } from '@/js/composables/global-properties';
import { toast } from '@/js/toast';
import { useFavouritesStore } from '@/stores/favourites';
import { useUserStore } from '@/stores/user';

const MAX_SHOWN = 8;

const { $gettext } = useGlobalProperties();
const favourites = useFavouritesStore();
const user = useUserStore();
const dialog = useTemplateRef<InstanceType<typeof ModalCard>>('dialog');

// closed without an answer: asked again at the next start, or the next sign in
const dismissed = ref(false);
watch(
  () => user.id,
  () => (dismissed.value = false)
);
const busy = ref(false);

const shown = computed(() => favourites.deviceOffer.slice(0, MAX_SHOWN));
const more = computed(() => Math.max(favourites.deviceOffer.length - MAX_SHOWN, 0));

watch(
  () => favourites.deviceOffer.length > 0 && !dismissed.value,
  (ask) => {
    if (ask) {
      dialog.value?.show();
    } else if (!busy.value) {
      dialog.value?.hide();
    }
  },
  { flush: 'post' }
);

async function answer(action: () => Promise<void>) {
  busy.value = true;
  try {
    await action();
  } catch {
    toast({ message: $gettext('An error occurred, please try again'), type: 'is-danger' });
  } finally {
    dialog.value?.hide();
    busy.value = false;
  }
}

const add = () => answer(favourites.acceptDeviceFavourites);
const keep = () => answer(favourites.declineDeviceFavourites);
</script>

<style scoped>
.device-favourites {
  margin: 0.75rem 0;
  list-style: disc inside;
}
</style>
