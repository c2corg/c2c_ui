<template>
  <div class="image-info has-text-light" v-if="visible">
    <h3 class="title is-3 has-text-light" v-translate>Infos</h3>

    <div v-if="document">
      <p v-if="document.date_time">
        <fa-icon icon="calendar" />
        <label>
          {{ $dateUtils.toLocalizedString(document.date_time, 'lll') }}
        </label>
      </p>

      <p v-if="document.cooked.title">
        <fa-icon icon="tag" />
        <label>
          {{ document.cooked.title }}
        </label>
      </p>

      <p v-if="author">
        <fa-icon icon="user" />
        <label>
          {{ author }}
        </label>
      </p>

      <markdown v-if="document.cooked.summary" class="is-italic" :content="document.cooked.summary" />
      <markdown v-if="document.cooked.description" :content="document.cooked.description" />

      <p v-if="document.image_type">
        <icon-creative-commons />
        <label>
          {{ $gettext(document.image_type) }}
        </label>
      </p>

      <h4 class="title is-4 has-text-light" v-translate>Settings</h4>

      <ul>
        <li v-if="document.camera_name">{{ document.camera_name }}</li>
        <li v-if="document.exposure_time" :title="$gettext('exposure_time')">{{ document.exposure_time }}s</li>
        <li v-if="document.fnumber" :title="$gettext('fnumber')">f/{{ document.fnumber }}</li>
        <li v-if="document.focal_length" :title="$gettext('focal_length')">{{ document.focal_length }}&nbsp;mm</li>
        <li v-if="document.iso_speed" :title="$gettext('iso_speed')">{{ document.iso_speed }} ISO</li>
        <li v-if="document.width && document.height" :title="$gettext('resolution')">
          {{ document.height }} x {{ document.width }} <span v-translate>pixels</span>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

import type { ApiData } from '@/js/apis/BaseApi';
import c2c from '@/js/apis/c2c';
import type DocumentService from '@/js/apis/c2c/DocumentService';
import { useGlobalProperties } from '@/js/composables/global-properties';

const { $language } = useGlobalProperties();

const promise = ref<Partial<ApiData>>({});
const visible = ref(false);

const document = computed(() => promise.value.data ?? null);
const author = computed(() => (document.value!.author ? document.value!.author : document.value!.creator?.name));

function show(documentId: number) {
  visible.value = true;
  promise.value = (c2c.image as DocumentService).getCooked(documentId, c2c.getApiLang($language.current ?? undefined)!);
}

function hide() {
  visible.value = false;
}

function toggle(documentId: number) {
  if (visible.value) {
    hide();
  } else {
    show(documentId);
  }
}

// the image viewer shows and hides the infos of its current image
defineExpose({ show, hide, toggle });
</script>

<style scoped lang="scss">
.image-info {
  background: rgba(0, 0, 0, 0.7);
  padding: 1rem;
}
</style>
