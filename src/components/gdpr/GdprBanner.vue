<template>
  <div class="no-print">
    <div class="gdpr-content" :class="{ active: active }">
      <h4 class="title" v-translate>Control the use of your personal data</h4>
      <div class="message">
        <span v-translate class="has-text-justified">
          Our website uses cookies provided by ourselves and third parties. Some cookies are necessary for the website,
          while you can adjust others at any time, in particular those that allow us to understand the performance of
          our website and to offer you social media features. You can accept or reject all, or
        </span>
        <a @click="showGdprModal()" v-translate>configure your choices</a>.
      </div>
      <div class="buttons mt-2 is-flex is-justify-content-flex-end">
        <button @click="acceptGdpr(false)" class="button is-danger" v-translate>Deny all</button>
        <button @click="acceptGdpr(true)" class="button is-primary" v-translate>Allow all</button>
      </div>
    </div>
    <gdpr-modal ref="modal"></gdpr-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeMount, onBeforeUnmount, onMounted, ref, useTemplateRef } from 'vue';

import GdprModal from './GdprModal.vue';

import { useGlobalProperties } from '@/js/composables/global-properties';
import bus from '@/js/event-bus';

const { $gdpr } = useGlobalProperties();

const userHasInteracted = ref(false);
const modal = useTemplateRef<{ show(): void }>('modal');

const active = computed(() => !$gdpr.get() && userHasInteracted.value);

function showGdprModal() {
  modal.value!.show();
}

function acceptGdpr(accept: boolean) {
  $gdpr.setAll(accept);
}

const INTERACTIONS = ['scroll', 'keydown', 'resize', 'click'];

function firstUserInteraction() {
  INTERACTIONS.forEach((event) => window.removeEventListener(event, firstUserInteraction));
  userHasInteracted.value = true;
}

onBeforeMount(() => {
  INTERACTIONS.forEach((event) => window.addEventListener(event, firstUserInteraction));
});

onMounted(() => {
  bus.on('show-gdpr', showGdprModal);
});

onBeforeUnmount(() => {
  bus.off('show-gdpr', showGdprModal);
});
</script>

<style lang="scss" scoped>
.gdpr-content {
  z-index: 30;
  position: fixed;
  top: 0;
  padding: 10px;

  margin: 0 auto;
  flex-direction: column;
  display: flex;
  background-color: white;
  box-shadow: none;
  transform: translateY(-100%);
  transition: transform 0.25s ease-in-out;

  &.active {
    box-shadow: rgba(0, 0, 0, 0.3) 1px 1px 6px 0;
    transform: translateY(0);
  }
}

@media screen and (min-width: $desktop) {
  .gdpr-content {
    width: 50%;
    left: calc(25% - 10px);

    border-bottom-left-radius: 4px;
    border-bottom-right-radius: 4px;
  }
}
</style>
