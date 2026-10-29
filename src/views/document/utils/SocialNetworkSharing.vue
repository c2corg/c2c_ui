<template>
  <span>
    <span
      v-if="addThisEnabled"
      v-show="addThisVisible"
      class="social-network-sharing"
      addthis:ui_click="true"
      addthis:data_track_clickback="false"
      addthis:data_track_addressbar="false"
      v-bind="$attrs"
      :title="$gettext('Share')"
    >
      <fa-icon icon="share-alt" />
    </span>
    <span v-else-if="supportsWebShare" :title="$gettext('Share')" @click="webShare()">
      <fa-icon icon="share-alt" />
    </span>
  </span>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';

import { useGlobalProperties } from '@/js/composables/global-properties';
import config from '@/js/config';
import { documentProperty } from '@/js/properties';

const cdn = '//s7.addthis.com/js/300/addthis_widget.js';

// the AddThis script, once loaded
const addthis = () => (window as { addthis?: { button: (selector: string) => void } }).addthis;

const props = defineProps({ ...documentProperty });

const { $gdpr, $documentUtils } = useGlobalProperties();

const addThisVisible = ref(false);

// with the consent of the user to social networks
const addThisEnabled = computed(() => $gdpr.get()?.social ?? false);

const supportsWebShare = !!navigator.share;

function onAddthisLoad() {
  addThisVisible.value = true;
  addthis()?.button('.social-network-sharing');
}

function installAddThis() {
  if (document.getElementById('addthis-script') !== null) {
    onAddthisLoad();
    return;
  }

  const el = document.createElement('script');

  el.setAttribute('id', 'addthis-script');
  el.setAttribute('src', `${cdn}#pubid=${config.addthisPublicId}`);
  el.onload = onAddthisLoad;
  document.body.appendChild(el);
}

function uninstallAddThis() {
  addThisVisible.value = false;
  const el = document.getElementById('addthis-script');
  if (el === null) {
    return;
  }
  document.body.removeChild(el);
  delete (window as { addthis?: unknown }).addthis;
}

function webShare() {
  navigator.share({
    title: $documentUtils.getDocumentTitle(props.document),
    url: window.location.href,
  });
}

// installed or removed with the consent (was a side effect of the addThisEnabled computed)
watch(addThisEnabled, (enabled) => (enabled ? installAddThis() : uninstallAddThis()), { immediate: true });
</script>
