<template>
  <div>
    <p class="mb-4" v-translate>
      The images linked to no document, the last uploaded first. Link them to a document from their page, or delete
      them: a moderator can restore them during 29 days, from the deleted documents.
    </p>
    <p class="mb-4" v-translate>
      An image shown in the text of a document is used, even without a link: link it to that document rather than delete
      it.
    </p>

    <div class="field is-grouped is-align-items-center mb-4">
      <div class="select">
        <select v-model="imageType" @change="reload" :aria-label="$gettext('Image type')">
          <option value="">{{ $gettext('All') }}</option>
          <option v-for="type of ORPHAN_IMAGE_TYPES" :key="type" :value="type">
            {{ $filters.uppercaseFirstLetter($gettext(type, 'image_types')) }}
          </option>
        </select>
      </div>
      <span v-if="!page.loading || images.length" class="has-text-grey is-size-7 ml-3"
        >{{ $gettext('Found:') }} {{ total }}</span
      >
    </div>

    <div v-if="deleteError" class="notification is-danger">
      <button class="delete" @click="deleteError = null" :aria-label="$gettext('Close')" />
      <span v-translate>The image could not be deleted:</span> #{{ deleteError }}
    </div>

    <div v-if="page.error" class="notification is-danger" v-translate>The orphan images could not be loaded.</div>
    <p v-else-if="!page.loading && images.length === 0" class="has-text-grey" v-translate>No orphan image.</p>

    <div class="columns is-multiline is-variable is-2">
      <div v-for="image of images" :key="image.document_id" class="column is-6-tablet is-4-desktop is-3-widescreen">
        <div class="box orphan-image">
          <router-link :to="documentRoute('i', image.document_id)" class="thumbnail-link">
            <thumbnail :img="image" size="MI" loading="lazy" class="thumbnail" />
          </router-link>
          <p class="mt-2 has-text-weight-semibold is-clipped">
            <router-link :to="documentRoute('i', image.document_id)">
              {{ image.title || '#' + image.document_id }}
            </router-link>
          </p>
          <p class="is-size-7 mt-1">
            <span v-if="image.image_type" class="tag mr-1" :class="TYPE_CLASSES[image.image_type]">
              {{ $gettext(image.image_type, 'image_types') }}
            </span>
            <template v-if="image.author">
              <contributor-link :contributor="image.author" /><span v-if="image.created_at"
                >, {{ $dateUtils.toLocalizedString(image.created_at, 'll') }}</span
              >
            </template>
          </p>
          <p v-if="image.last_unlink" class="is-size-7 has-text-grey mt-1">
            <span v-translate>Unlinked from</span>
            <icon-document :document-type="letterToDocumentType[image.last_unlink.document_type]" fixed-width />
            <router-link :to="documentRoute(image.last_unlink.document_type, image.last_unlink.document_id)"
              >#{{ image.last_unlink.document_id }}</router-link
            >
            <template v-if="image.last_unlink.by">
              <span v-translate>by</span> <contributor-link :contributor="image.last_unlink.by" /></template
            ><span>, {{ $dateUtils.toLocalizedString(image.last_unlink.at, 'll') }}</span>
          </p>
          <div v-if="image.embedded_in?.length" class="notification is-warning is-light is-size-7 p-2 mt-2 mb-0">
            <p class="has-text-weight-semibold" v-translate>Shown in the text of:</p>
            <p v-for="document of image.embedded_in" :key="document.document_id" class="embedded-in is-clipped">
              <icon-document :document-type="letterToDocumentType[document.document_type]" fixed-width />
              <router-link :to="documentRoute(document.document_type, document.document_id, document.langs[0])">
                {{ document.title || '#' + document.document_id }}
              </router-link>
              <span v-for="lang of document.langs" :key="lang" class="tag is-white ml-1">{{ lang }}</span>
            </p>
          </div>
          <div class="mt-2">
            <!-- a first click arms the button, a second one deletes: one image at a time, without a window. An
                 image shown in a text is used: not deleted from here -->
            <button
              class="button"
              :class="[
                armed === image.document_id ? 'is-danger' : 'is-danger is-light',
                { 'is-loading': deleting.has(image.document_id) },
              ]"
              :disabled="!!image.embedded_in?.length"
              :title="
                image.embedded_in?.length ? $gettext('Shown in the text of a document: link it instead') : undefined
              "
              @click="onDelete(image)"
            >
              <fa-icon icon="trash" class="mr-1" />
              <span>{{ armed === image.document_id ? $gettext('Confirm the deletion') : $gettext('Delete') }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="has-text-centered mt-4">
      <button
        v-if="images.length < total"
        class="button"
        :class="{ 'is-loading': page.loading }"
        @click="loadMore"
        v-translate
      >
        More
      </button>
      <span v-else-if="page.loading" class="button is-loading is-white" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, shallowRef } from 'vue';

import { documentRoute } from './deleted-documents';

import type { ApiData } from '@/js/apis/BaseApi';
import c2c from '@/js/apis/c2c';
import { ORPHAN_IMAGE_TYPES, type OrphanImage } from '@/js/apis/c2c/schemas';
import constants from '@/js/constants';

const PAGE_SIZE = 30;
// how long the armed delete button waits for the second click
const ARMED_DELAY = 4000;

const TYPE_CLASSES: Record<string, string> = {
  personal: 'is-info is-light',
  collaborative: 'is-success is-light',
  copyright: 'is-warning is-light',
};

const { letterToDocumentType } = constants;

const imageType = ref('');
const images = ref<OrphanImage[]>([]);
const total = ref(0);
// a page answered after the filter changed is dropped
let generation = 0;
const page = shallowRef<ApiData>(load(0));

const armed = ref<number | null>(null);
let disarm: ReturnType<typeof setTimeout> | undefined;
const deleting = reactive(new Set<number>());
const deleteError = ref<number | null>(null);

function load(offset: number): ApiData {
  const current = generation;
  return c2c.moderator.getOrphanImages(offset, PAGE_SIZE, imageType.value).then((response) => {
    if (current !== generation) {
      return;
    }
    // an image deleted meanwhile shifts the pages: no image twice
    const known = new Set(images.value.map((image) => image.document_id));
    images.value.push(...response.data.images.filter((image) => !known.has(image.document_id)));
    total.value = response.data.total;
  });
}

function reload() {
  generation += 1;
  images.value = [];
  total.value = 0;
  page.value = load(0);
}

function loadMore() {
  page.value = load(images.value.length);
}

function onDelete(image: OrphanImage) {
  const id = image.document_id;
  if (deleting.has(id)) {
    return;
  }
  clearTimeout(disarm);
  if (armed.value !== id) {
    armed.value = id;
    disarm = setTimeout(() => (armed.value = null), ARMED_DELAY);
    return;
  }
  armed.value = null;
  deleting.add(id);
  deleteError.value = null;
  c2c.moderator.deleteDocument(id).then(
    () => {
      deleting.delete(id);
      images.value = images.value.filter((i) => i.document_id !== id);
      total.value -= 1;
    },
    () => {
      deleting.delete(id);
      deleteError.value = id;
    }
  );
}
</script>

<style scoped>
.embedded-in {
  white-space: nowrap;
  text-overflow: ellipsis;
}

.thumbnail-link {
  display: block;
  aspect-ratio: 4 / 3;
  background: var(--c2c-white-ter);
}

.thumbnail {
  display: block;
  width: 100%;
  height: 100%;
}

.thumbnail :deep(img) {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
</style>
