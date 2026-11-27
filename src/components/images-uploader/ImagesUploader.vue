<template>
  <modal-card ref="modal" class="images-uploader" wide>
    <div class="columns is-multiline images-uploader-files">
      <div
        v-for="(image, key) of images"
        :key="key"
        class="column is-one-third-widescreen is-half-desktop is-half-tablet is-12-mobile"
      >
        <image-uploader
          :categories-edition="categoriesEdition"
          :status="image.status"
          :data-url="image.dataUrl ?? undefined"
          :percent-completed="image.percentCompleted"
          :document="image.document"
          :is-initial="image.status === 'INITIAL'"
          :is-saving="image.status === 'SAVING'"
          :is-success="image.status === 'SUCCESS'"
          :is-failed="image.status === 'FAILED'"
          :can-rotate="Boolean(image.dataUrl) && canRender(image.file)"
          :same-photo="image.samePhoto"
          @choose="onChoose(image, $event)"
          @reload-same-photo="loadSamePhoto(image)"
          @delete-image="onDeleteImage(image)"
          @rotate-image="onRotateImage(image, $event)"
          @retry-upload="startUpload(image)"
        />
      </div>

      <div class="column is-one-third-widescreen is-half-desktop is-half-tablet is-12-mobile">
        <div class="images-uploader-message" :class="{ 'images-uploader-message-dragover': dragOver }">
          <input
            ref="fileInput"
            type="file"
            @change="onFilesChange"
            @dragenter="dragOver = true"
            @dragover="dragOver = true"
            @dragleave="dragOver = false"
            @drop="dragOver = false"
            multiple
            accept="image/*,.heic,.heif"
            class="input-file"
          />
          <!-- this message contains HTML -->
          <!-- eslint-disable-next-line vue/no-v-html -->
          <span v-html="$gettext('Drop images here or click to upload')" />
        </div>
      </div>
    </div>

    <template #footer>
      <div class="buttons">
        <button
          :disabled="Object.keys(images).length === 0"
          class="button is-information"
          @click="categoriesEdition = !categoriesEdition"
        >
          <span v-if="categoriesEdition" v-translate>Edit titles</span>
          <span v-else v-translate>Edit categories</span>
        </button>
        <button
          :disabled="!readyForSaving"
          class="button is-primary"
          :class="{ 'is-loading': promise.loading }"
          @click="save"
          v-translate
        >
          Save
        </button>
        <button class="button is-warning" @click="hide" v-translate>Close</button>
      </div>
    </template>
  </modal-card>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, useTemplateRef, watch, type PropType } from 'vue';
import { useRoute } from 'vue-router';

import ImageUploader from './ImageUploader.vue';

import c2c from '@/js/apis/c2c';
import { useGlobalProperties } from '@/js/composables/global-properties';
import { CONFIDENT_FIT, locateImages, readTrack } from '@/js/geo/locate-images';
import { findSamePhoto, loadEditableImage, saveImageTitle, titleLang, type ListedImage } from '@/js/image-title';
import { refreshOutingQuality } from '@/js/refresh-outing-quality';
import { notify, toast } from '@/js/toast';
import uploadFile, { canRender } from '@/js/upload-file';
import type { C2cDocument } from '@/js/vue-plugins/document-utils';

// a photo the document already has: the user chooses to change its title (retitle) or to add the copy (add)
type SamePhoto = {
  documentId: number;
  lang: string;
  title: string;
  // the image to save with the new title, once the user may change it; null while loaded or when it can't be
  image: C2cDocument | null;
  editable: boolean | null;
  // the image could not be loaded (the network): whether the user may change it is not known, the load is asked again
  loadFailed: boolean;
  choice: 'retitle' | 'add' | null;
};

type UploadedImage = {
  file: File;
  key: string;
  document: C2cDocument;
  dataUrl: string | null;
  percentCompleted: number;
  status: 'INITIAL' | 'SAVING' | 'SUCCESS' | 'FAILED';
  errorMessage: string | null;
  samePhoto: SamePhoto | null;
};

const props = defineProps({
  lang: {
    type: String,
    required: true,
  },
  parentDocument: {
    type: Object as PropType<C2cDocument & { article_type?: string | null; activities?: string[] | null }>,
    required: true,
  },
});

const route = useRoute();
const { $documentUtils, $gettext, $language, $user } = useGlobalProperties();

const images = ref<Record<string, UploadedImage>>({});
const categoriesEdition = ref(false);
const promise = ref<{ loading?: boolean }>({});
const readyForSaving = ref(false);
const dragOver = ref(false);
const modal = useTemplateRef<{ show(): void; hide(): void }>('modal');
const fileInput = useTemplateRef<HTMLInputElement>('fileInput');

const imageType = computed(() => {
  const type = props.parentDocument.type;
  if (type === 'o' || type === 'u' || type === 'x') {
    return 'personal';
  }

  if (type === 'c') {
    return props.parentDocument.article_type === 'collab' ? 'collaborative' : 'personal';
  }

  return 'collaborative';
});

// the images to create: not the photos the user chose to give another title
const documents = computed(() =>
  Object.values(images.value)
    .filter((image) => image.samePhoto?.choice !== 'retitle')
    .map((image) => image.document)
);
const retitled = computed(() => Object.values(images.value).filter((image) => image.samePhoto?.choice === 'retitle'));

const associationsArrayName = computed(() => $documentUtils.getAssociationArrayName(props.parentDocument));

function preventDrag(event: Event) {
  if (event.target !== fileInput.value) {
    event.preventDefault();
  }
}

function show() {
  modal.value!.show();
}

function hide() {
  modal.value!.hide();
}

function clean() {
  Object.values(images.value).forEach(revokePreview);
  images.value = {};
  categoriesEdition.value = false;
  promise.value = {};
  readyForSaving.value = false;
  dragOver.value = false;
}

function computeReadyForSaving() {
  const values = Object.values(images.value);
  readyForSaving.value =
    values.length !== 0 &&
    values.every(
      (image) =>
        image.status === 'SUCCESS' &&
        (!image.samePhoto ||
          image.samePhoto.choice === 'add' ||
          (image.samePhoto.choice === 'retitle' && image.samePhoto.image !== null))
    );
}

// the previews are object URLs of the files: freed when replaced or dropped
function revokePreview(image: UploadedImage) {
  if (image.dataUrl?.startsWith('blob:')) {
    URL.revokeObjectURL(image.dataUrl);
  }
}

function onDeleteImage(image: UploadedImage) {
  revokePreview(image);
  if (images.value[image.key]) {
    images.value = Object.fromEntries(Object.entries(images.value).filter(([key]) => key !== image.key));
  }

  computeReadyForSaving();
}

// build an object that ships all data needed for one file to upload :
// file : OS file object to upload
// key : unique key that identify it
// document : c2c document that will be saved once the file is uploaded
// dataUrl : raw representation of the image (used in HTML src attribute)
// status : INITIAL, SAVING, SUCCESS or FAILED
// percentCompleted : no comment :)
// errorMessage : not yet used ?
function buildImageObject(file: File, key: string): UploadedImage {
  const parent = props.parentDocument;
  const document = $documentUtils.buildDocument('image', props.lang) as C2cDocument & Record<string, unknown>;
  document.activities = parent.activities ? parent.activities.slice(0) : [];
  document.geometry!.geom = parent.geometry ? parent.geometry.geom : null;
  document.file_size = file.size;
  document.image_type = imageType.value;
  document.quality = 'medium';
  document.associations![associationsArrayName.value] = [{ document_id: parent.document_id }];

  return {
    file,
    key,
    document,
    dataUrl: null,
    percentCompleted: 0,
    status: 'INITIAL',
    errorMessage: null,
    samePhoto: null,
  };
}

// the uploaded photo is one of the document already: the user is asked whether it was to change its title
function checkSamePhoto(image: UploadedImage) {
  const existing = props.parentDocument.associations?.images as (ListedImage & { document_id: number })[] | undefined;
  const same = findSamePhoto(image.document as ListedImage, existing ?? []);
  if (!same) {
    image.samePhoto = null;
    return;
  }
  const lang = titleLang(same, props.lang);
  const title = same.locales?.[0]?.title ?? '';
  image.samePhoto = {
    documentId: same.document_id,
    lang,
    title,
    image: null,
    editable: null,
    loadFailed: false,
    choice: null,
  };
  // the title field of the card is the new title: the current one to start with
  image.document.locales![0].title = title;
  loadSamePhoto(image);
}

// the image to save with the new title (its current versions), and whether the user may change it
function loadSamePhoto(image: UploadedImage) {
  const same = image.samePhoto!;
  same.image = null;
  same.loadFailed = false;
  computeReadyForSaving();
  loadEditableImage(same.documentId, same.lang, $user)
    .then(({ image: loaded, editable }) => {
      if (image.samePhoto === same) {
        same.editable = editable;
        same.image = editable ? loaded : null;
        // its current title (another one may have been saved meanwhile) is the one an unchanged title is compared to,
        // and the new title to start with while the user has not changed it
        const current = loaded.locales?.[0]?.title ?? same.title;
        if (image.document.locales![0].title === same.title) {
          image.document.locales![0].title = current;
        }
        same.title = current;
        computeReadyForSaving();
      }
    })
    .catch(() => {
      // not known (the network): the card offers to try again
      if (image.samePhoto === same) {
        same.loadFailed = true;
        computeReadyForSaving();
      }
    });
}

function onChoose(image: UploadedImage, choice: 'retitle' | 'add' | null) {
  if (image.samePhoto) {
    image.samePhoto.choice = choice;
    if (choice === 'add' && image.document.locales![0].title === image.samePhoto.title) {
      // a copy with the same title is what made the duplicates: the user gives it its own
      image.document.locales![0].title = '';
    } else if (choice === 'retitle' && !image.document.locales![0].title) {
      image.document.locales![0].title = image.samePhoto.title;
    }
  }
  computeReadyForSaving();
}

function onUploadProgress(event: { loaded: number; total: number }, image: UploadedImage) {
  image.status = 'SAVING';
  if (event.total !== 0) {
    image.percentCompleted = Math.floor((event.loaded * 100) / event.total);
  }
}

function onUploadSuccess(document: Record<string, unknown>, image: UploadedImage) {
  image.status = 'SUCCESS';

  Object.assign(image.document, document);
  checkSamePhoto(image);
  computeReadyForSaving();
}

function onUploadFailure(event: unknown, image: UploadedImage) {
  image.percentCompleted = 100;
  image.status = 'FAILED';
  image.errorMessage = (event as { message?: string } | undefined)?.message ?? $gettext('Image could not be processed');
}

function startUpload(image: UploadedImage, angle = 0) {
  image.status = 'INITIAL';
  image.percentCompleted = 0;

  uploadFile(
    image.file,
    angle,
    /*onDataUrlReady =*/ (dataUrl) => {
      revokePreview(image);
      image.dataUrl = dataUrl;
    },
    (event) => {
      onUploadProgress(event as { loaded: number; total: number }, image);
    },
    (document) => {
      onUploadSuccess(document, image);
    },
    (event) => {
      onUploadFailure(event, image);
    }
  );
}

function onFilesChange(event: Event) {
  const input = event.target as HTMLInputElement;
  for (const file of input.files ?? []) {
    const key = file.name + '#' + file.lastModified;

    if (images.value[key] === undefined) {
      const image = buildImageObject(file, key);

      images.value = { ...images.value, [image.key]: image };
      // the reactive image: the upload callbacks update its status and progress
      startUpload(images.value[image.key]);
    }
  }

  // clean HTML input : if user delete upload, and re-upload same image
  input.value = '';
  computeReadyForSaving();
}

function onRotateImage(image: UploadedImage, angle: number) {
  startUpload(image, angle);
  computeReadyForSaving();
}

// the images of an outing without a location of their own (they got the outing's): located on its GPS track (#4259)
function locateOnTrack(saved: C2cDocument[]) {
  const parent = props.parentDocument as C2cDocument & { date_start?: string | null; date_end?: string | null };
  const track = parent.type === 'o' ? readTrack(parent.geometry?.geom_detail) : [];
  if (track.length < 2) {
    return 0;
  }
  const images = saved as (C2cDocument & { date_time?: string; camera_name?: string; elevation?: number })[];
  const defaults = [parent.geometry?.geom, ...(parent.associations?.routes ?? []).map((route) => route.geometry?.geom)];
  const locations = locateImages(
    images.map((image) => ({ ...image, geom: image.geometry?.geom })),
    track,
    defaults,
    parent,
    { minFit: CONFIDENT_FIT }
  );
  images.forEach((image, i) => {
    const location = locations[i];
    if (location) {
      image.geometry = { ...image.geometry, geom: location.geom };
      image.elevation ??= location.elevation;
    }
  });
  return locations.filter(Boolean).length;
}

// the photos the document had, with the titles the user gave them in the uploader; the page shows the new titles
// A title not saved (the image changed meanwhile, the network) keeps the uploader open: the image is loaded again with
// its current versions, and Save tries again; the titles already saved are then unchanged, not sent again
class TitleNotSaved extends Error {}

async function saveTitles() {
  const comment = $gettext('Title changed from the image uploader');
  for (const image of retitled.value) {
    const same = image.samePhoto!;
    const title = (image.document.locales![0].title ?? '').trim();
    if (title === same.title) {
      continue;
    }
    try {
      await saveImageTitle(same.image!, title, comment);
    } catch {
      loadSamePhoto(image);
      throw new TitleNotSaved();
    }
    same.title = title;
    const listed = props.parentDocument.associations?.images?.find((item) => item.document_id === same.documentId);
    if (listed?.locales?.[0]) {
      listed.locales[0].title = title;
    }
  }
}

function save() {
  const saved = documents.value;
  const located = locateOnTrack(saved);
  promise.value = { loading: true };
  saveTitles()
    .then(async () => (saved.length ? (await c2c.createImages(saved)).data : { images: [] }))
    .then((data: { images: { document_id: number }[] }) => {
      const response = { data };
      // add result to parent, it will update page
      // we fake a valid img document with enough info to work
      props.parentDocument.associations!.images!.push(
        ...saved.map((img, idx) => ({
          ...img,
          document_id: response.data.images[idx].document_id,
          available_langs: [$language.current!],
          // its AVIF thumbnails may not be built yet: the JPG ones until the page is reloaded
          modernThumbnailsPending: true,
        }))
      );
      clean();
      hide();

      if (located) {
        notify($gettext('Images located on the GPS track of the outing:') + ' ' + located, 'is-success');
      }

      // the images count in the quality of an outing
      const imageIds = response.data.images.map((image: { document_id: number }) => image.document_id);
      if (imageIds.length === 0) {
        // only titles changed
        return;
      }
      refreshOutingQuality(
        props.parentDocument,
        props.lang,
        imageIds,
        $user,
        $gettext('Quality computed again after adding images')
      )
        .then((quality) => {
          if (quality) {
            props.parentDocument.quality = quality;
          }
        })
        // not saved (the outing was changed meanwhile, the network went): the quality is computed on its next edit
        .catch(() => undefined);
    })
    .catch((error: unknown) => {
      if (error instanceof TitleNotSaved) {
        promise.value = {};
        toast({ message: $gettext(`An error occurred, couldn't save the title`), type: 'is-danger' });
        return;
      }
      clean();
      hide();
      toast({
        message: $gettext(`An error occurred, couldn't save images`),
        type: 'is-danger',
      });
    });
}

// this component saves its state. It allows an user to close window
// with unsaved images, and re-open it without loosing its images
//
// Here is the issue:
// if the user starts an image load, then closes the window without saving
// and goes to another page, the component won't be reloaded
// and loaded images could be accessible from the next document
// so, if the route changes, we must clean
watch(() => route.fullPath, clean);

onMounted(() => {
  window.addEventListener('dragover', preventDrag, false);
  window.addEventListener('drop', preventDrag, false);
});

onBeforeUnmount(() => {
  window.removeEventListener('dragover', preventDrag);
  window.removeEventListener('drop', preventDrag);
});

// the document header opens it
defineExpose({ show });
</script>

<style scoped>
/* TODO : modal background color with more alpha in Variables */

.images-uploader {
  .images-uploader-message {
    position: relative;
    height: 315px;
    text-align: center;
    border: 5px dashed var(--c2c-grey-lighter);
    background: var(--c2c-white-ter);
    transition: 0.2s;
    padding: 1rem;

    input {
      opacity: 0; /* invisible but it's there! */
      width: 100%;
      height: 100%;
      position: absolute;
      top: 0;
      left: 0;
      cursor: pointer;
    }
  }

  .images-uploader-message:hover {
    background: var(--c2c-grey-lightest);
    border: 5px dashed #bbb;
  }

  .images-uploader-message-dragover {
    background: rgb(184, 238, 177);
    border: 5px dashed green;
  }
}
</style>
