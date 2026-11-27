<template>
  <div>
    <p class="mb-4" v-translate>
      The images uploaded more than once: the same file (size, dimensions and date of the photo), the last uploaded
      first. Choose the image to keep, then merge the copies into it (their links and the texts showing them go to the
      kept image), delete a copy, or tell that the images are not copies.
    </p>

    <div class="field is-grouped is-align-items-center mb-4">
      <div class="select">
        <select v-model="sameDocument" @change="reload" :aria-label="$gettext('Duplicate images')">
          <option :value="false">{{ $gettext('All') }}</option>
          <option :value="true">{{ $gettext('On the same document') }}</option>
        </select>
      </div>
      <span v-if="!page.loading || sets.length" class="has-text-grey is-size-7 ml-3"
        >{{ $gettext('Found:') }} {{ total }}</span
      >
    </div>

    <div v-if="actionError" class="notification is-danger">
      <button class="delete" @click="actionError = null" :aria-label="$gettext('Close')" />
      <span v-translate>The action failed for the image:</span> #{{ actionError }}
    </div>

    <div v-if="page.error" class="notification is-danger" v-translate>The duplicate images could not be loaded.</div>
    <p v-else-if="!page.loading && sets.length === 0" class="has-text-grey" v-translate>No duplicate image.</p>

    <div v-for="set of sets" :key="set.key" class="box duplicate-set">
      <div class="tags mb-3">
        <span class="tag is-dark">{{ set.images.length }} {{ $gettext('copies') }}</span>
        <span v-if="set.same_document" class="tag is-danger is-light" v-translate>On the same document</span>
        <span v-if="sameUploader(set.images)" class="tag is-light" v-translate>Same uploader</span>
        <span v-if="uploadSpan(set.images) !== null" class="tag is-light">
          {{ $gettext('Uploaded within') }} {{ spanText(uploadSpan(set.images)!) }}
        </span>
      </div>

      <div class="columns is-multiline is-variable is-2 is-mobile">
        <div
          v-for="image of set.images"
          :key="image.document_id"
          class="column is-12-mobile is-6-tablet is-4-desktop is-3-widescreen"
        >
          <div class="duplicate-image" :class="{ 'is-kept': image.document_id === set.kept }">
            <label class="radio keep mb-2">
              <input
                type="radio"
                :name="'keep-' + set.key"
                :value="image.document_id"
                v-model="set.kept"
                @change="disarm()"
              />
              <span class="ml-1">{{ image.document_id === set.kept ? $gettext('Kept') : $gettext('Keep') }}</span>
            </label>

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
                  >, {{ $dateUtils.toLocalizedString(image.created_at, 'lll') }}</span
                >
              </template>
            </p>
            <p class="is-size-7 has-text-grey mt-1">{{ details(image) }}</p>

            <div class="is-size-7 mt-2">
              <p class="has-text-weight-semibold" v-translate>Linked to</p>
              <p v-if="image.documents.length === 0" class="has-text-grey" v-translate>No document</p>
              <p v-for="doc of image.documents" :key="doc.document_id" class="is-clipped">
                <icon-document :document-type="letterToDocumentType[doc.document_type]" fixed-width />
                <router-link :to="documentRoute(doc.document_type, doc.document_id)">
                  {{ titleOf(doc) }}
                </router-link>
              </p>
            </div>

            <div v-if="image.embedded_in.length" class="is-size-7 mt-2">
              <p class="has-text-weight-semibold" v-translate>Shown in the text of</p>
              <p
                v-for="text of image.embedded_in"
                :key="text.document_id + text.lang + text.image_id"
                class="is-clipped"
              >
                <icon-document :document-type="letterToDocumentType[text.document_type]" fixed-width />
                <router-link :to="documentRoute(text.document_type, text.document_id)">
                  {{ titleOf(text) }}
                </router-link>
                ({{ text.lang }})<span v-if="text.image_id !== image.document_id" class="has-text-grey">
                  {{ $gettext('through') }} #{{ text.image_id }}</span
                >
              </p>
            </div>

            <div v-if="image.linked_from?.length" class="is-size-7 mt-2">
              <p class="has-text-weight-semibold" v-translate>Linked from the text of</p>
              <p
                v-for="text of image.linked_from"
                :key="text.document_id + text.lang + text.image_id"
                class="is-clipped"
              >
                <icon-document :document-type="letterToDocumentType[text.document_type]" fixed-width />
                <router-link :to="documentRoute(text.document_type, text.document_id)">
                  {{ titleOf(text) }}
                </router-link>
                ({{ text.lang }})<span v-if="text.image_id !== image.document_id" class="has-text-grey">
                  {{ $gettext('through') }} #{{ text.image_id }}</span
                >
              </p>
            </div>

            <!-- a first click arms a button, a second one does it: one action at a time, without a window -->
            <div v-if="image.document_id !== set.kept" class="buttons mt-3">
              <button
                class="button is-small"
                :class="[isArmed('merge', image.document_id) ? 'is-warning' : 'is-warning is-light', busyClass(image)]"
                @click="onMerge(set, image)"
              >
                <fa-icon icon="compress" class="mr-1" />
                <span>{{
                  isArmed('merge', image.document_id)
                    ? $gettext('Merge into') + ' #' + set.kept
                    : $gettext('Merge into kept')
                }}</span>
              </button>
              <button
                class="button is-small"
                :class="[isArmed('delete', image.document_id) ? 'is-danger' : 'is-danger is-light', busyClass(image)]"
                :disabled="isUsed(image)"
                :title="isUsed(image) ? $gettext('Shown in or linked from texts: merge it instead') : undefined"
                @click="onDelete(set, image)"
              >
                <fa-icon icon="trash" class="mr-1" />
                <span>{{
                  isArmed('delete', image.document_id) ? $gettext('Confirm the deletion') : $gettext('Delete')
                }}</span>
              </button>
              <button
                v-if="set.images.length > 2"
                class="button is-small"
                :class="[isArmed('apart', image.document_id) ? 'is-dark' : 'is-light', busyClass(image)]"
                @click="onApart(set, image)"
              >
                <span>{{ isArmed('apart', image.document_id) ? $gettext('Confirm') : $gettext('Not a copy') }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="buttons is-right mt-2">
        <button
          v-if="set.images.length > 2"
          class="button"
          :class="[isArmed('merge-all', set.key) ? 'is-warning' : 'is-warning is-light']"
          :disabled="busy.size > 0"
          @click="onMergeAll(set)"
        >
          <fa-icon icon="compress" class="mr-1" />
          <span>{{
            isArmed('merge-all', set.key)
              ? $gettext('Merge') + ' ' + (set.images.length - 1) + ' ' + $gettext('copies into') + ' #' + set.kept
              : $gettext('Merge all into kept')
          }}</span>
        </button>
        <button
          class="button"
          :class="[isArmed('dismiss', set.key) ? 'is-dark' : 'is-light']"
          :disabled="busy.size > 0"
          @click="onDismiss(set)"
        >
          <span>{{ isArmed('dismiss', set.key) ? $gettext('Confirm') : $gettext('Not duplicates') }}</span>
        </button>
      </div>
    </div>

    <div class="has-text-centered mt-4">
      <button
        v-if="sets.length < total"
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

import { documentRoute, documentTitle, type ListedDocument } from './deleted-documents';
import { defaultKept, fileSize, sameUploader, spanParts, uploadSpan } from './image-duplicates';

import type { ApiData } from '@/js/apis/BaseApi';
import c2c from '@/js/apis/c2c';
import type { DuplicateImage, DuplicateImageSet } from '@/js/apis/c2c/schemas';
import { useGlobalProperties } from '@/js/composables/global-properties';
import constants from '@/js/constants';

const PAGE_SIZE = 30;
// how long an armed button waits for the second click
const ARMED_DELAY = 4000;

const TYPE_CLASSES: Record<string, string> = {
  personal: 'is-info is-light',
  collaborative: 'is-success is-light',
  copyright: 'is-warning is-light',
};

type ShownSet = DuplicateImageSet & { key: string; kept: number };

const { letterToDocumentType } = constants;
const { $gettext, $dateUtils, $documentUtils } = useGlobalProperties();

const titleOf = (doc: ListedDocument) => documentTitle($documentUtils, doc);

const sameDocument = ref(false);
const sets = ref<ShownSet[]>([]);
const total = ref(0);
// a page answered after the filter changed is dropped
let generation = 0;
const page = shallowRef<ApiData>(load(0));

// the armed button: action and image id (or set key)
const armed = ref<string | null>(null);
let disarmTimer: ReturnType<typeof setTimeout> | undefined;
const busy = reactive(new Set<number>());
const actionError = ref<number | null>(null);

/** Shown in a text, or linked from one: deleting it breaks them, merging it keeps them */
const isUsed = (image: DuplicateImage) => image.embedded_in.length > 0 || !!image.linked_from?.length;

function load(offset: number): ApiData {
  const current = generation;
  return c2c.moderator.getDuplicateImages(offset, PAGE_SIZE, sameDocument.value).then((response) => {
    if (current !== generation) {
      return;
    }
    // a set handled meanwhile shifts the pages: no set twice
    const known = new Set(sets.value.map((set) => set.key));
    for (const set of response.data.sets) {
      const key = set.images.map((image) => image.document_id).join('-');
      if (!known.has(key)) {
        sets.value.push({ ...set, key, kept: defaultKept(set.images) });
      }
    }
    total.value = response.data.total;
  });
}

function reload() {
  generation += 1;
  sets.value = [];
  total.value = 0;
  page.value = load(0);
}

function loadMore() {
  page.value = load(sets.value.length);
}

function spanText(minutes: number): string {
  const { count, unit } = spanParts(minutes);
  const units = { minutes: $gettext('min'), hours: $gettext('h'), days: $gettext('days') };
  return `${count} ${units[unit]}`;
}

// dimensions, size, date of the photo and camera, those known
function details(image: DuplicateImage): string {
  return [
    image.width && image.height ? `${image.width} × ${image.height}` : '',
    fileSize(image.file_size),
    image.date_time ? $dateUtils.toLocalizedString(image.date_time, 'lll') : '',
    image.camera_name ?? '',
  ]
    .filter(Boolean)
    .join(' · ');
}

function isArmed(action: string, id: number | string): boolean {
  return armed.value === `${action}:${id}`;
}

function disarm() {
  clearTimeout(disarmTimer);
  armed.value = null;
}

// true on the second click: the action is to do
function confirmed(action: string, id: number | string): boolean {
  if (isArmed(action, id)) {
    disarm();
    return true;
  }
  disarm();
  armed.value = `${action}:${id}`;
  disarmTimer = setTimeout(() => (armed.value = null), ARMED_DELAY);
  return false;
}

function busyClass(image: DuplicateImage) {
  return { 'is-loading': busy.has(image.document_id) };
}

// an image handled leaves its set, a set of one image leaves the list
function dropImage(set: ShownSet, imageId: number) {
  set.images = set.images.filter((image) => image.document_id !== imageId);
  if (set.images.length < 2) {
    dropSet(set);
  }
}

function dropSet(set: ShownSet) {
  sets.value = sets.value.filter((s) => s.key !== set.key);
  total.value -= 1;
}

function run(set: ShownSet, image: DuplicateImage, action: () => ApiData): Promise<boolean> {
  const id = image.document_id;
  busy.add(id);
  actionError.value = null;
  // resolves to whether the action succeeded (an ApiData is not a Promise)
  return new Promise((resolve) => {
    action().then(
      () => {
        busy.delete(id);
        dropImage(set, id);
        resolve(true);
      },
      () => {
        busy.delete(id);
        actionError.value = id;
        resolve(false);
      }
    );
  });
}

function onMerge(set: ShownSet, image: DuplicateImage) {
  if (busy.has(image.document_id) || !confirmed('merge', image.document_id)) {
    return;
  }
  void run(set, image, () => c2c.moderator.mergeDocuments(image.document_id, set.kept));
}

function onDelete(set: ShownSet, image: DuplicateImage) {
  if (busy.has(image.document_id) || !confirmed('delete', image.document_id)) {
    return;
  }
  void run(set, image, () => c2c.moderator.deleteDocument(image.document_id));
}

// this image is not a copy of the others of its set
function onApart(set: ShownSet, image: DuplicateImage) {
  if (busy.has(image.document_id) || !confirmed('apart', image.document_id)) {
    return;
  }
  const others = set.images.filter((i) => i.document_id !== image.document_id).map((i) => i.document_id);
  void run(set, image, () => c2c.moderator.dismissDuplicateImages([image.document_id], others));
}

// one merge after the other: the set keeps the copies not merged when one fails
async function onMergeAll(set: ShownSet) {
  if (!confirmed('merge-all', set.key)) {
    return;
  }
  const kept = set.kept;
  for (const image of set.images.filter((i) => i.document_id !== kept)) {
    if (!(await run(set, image, () => c2c.moderator.mergeDocuments(image.document_id, kept)))) {
      return;
    }
  }
}

function onDismiss(set: ShownSet) {
  if (!confirmed('dismiss', set.key)) {
    return;
  }
  const ids = set.images.map((image) => image.document_id);
  actionError.value = null;
  c2c.moderator.dismissDuplicateImages(ids).then(
    () => dropSet(set),
    () => (actionError.value = ids[0]!)
  );
}
</script>

<style scoped>
.duplicate-image {
  height: 100%;
  padding: 0.75rem;
  border: 2px solid var(--c2c-white-ter);
  border-radius: 4px;
}

.duplicate-image.is-kept {
  border-color: var(--c2c-green);
}

.keep {
  display: block;
  font-weight: 600;
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
