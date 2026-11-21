<template>
  <!-- the share sheet of the phone or of the browser; without one, the link is copied. No third-party widget: AddThis,
       loaded with the "social networks" consent, was shut down in 2023 and its script no longer loads -->
  <span v-if="canShare" class="social-network-sharing" :title="$gettext('Share')" @click="share">
    <fa-icon icon="share-alt" />
  </span>
</template>

<script setup lang="ts">
import { useGlobalProperties } from '@/js/composables/global-properties';
import { documentProperty } from '@/js/properties';
import { notify } from '@/js/toast';

const props = defineProps({ ...documentProperty });

const { $gettext, $documentUtils } = useGlobalProperties();

const supportsWebShare = typeof navigator.share === 'function';
// the clipboard needs a secure page (https, or localhost)
const supportsClipboard = typeof navigator.clipboard?.writeText === 'function';
const canShare = supportsWebShare || supportsClipboard;

async function share() {
  const url = window.location.href;
  if (supportsWebShare) {
    try {
      await navigator.share({ title: $documentUtils.getDocumentTitle(props.document), url });
    } catch {
      // closed by the user (AbortError), or refused: nothing to say
    }
    return;
  }
  try {
    await navigator.clipboard.writeText(url);
    notify($gettext('Link copied'), 'is-success');
  } catch {
    notify($gettext('The link could not be copied'), 'is-warning');
  }
}
</script>
