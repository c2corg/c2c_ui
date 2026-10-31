<template>
  <modal-card ref="modal" class="images-uploader" wide>
    <div class="columns is-multiline images-uploader-files">
      <div
        v-for="(image, key) of images"
        :key="key"
        class="column is-one-third-fullhd is-one-third-widescreen is-half-desktop is-half-tablet is-12-mobile"
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
          :can-rotate="Boolean(image.file?.name) && !image.file.name.endsWith('.svg')"
          @delete-image="onDeleteImage(image)"
          @rotate-image="onRotateImage(image, $event)"
          @retry-upload="startUpload(image)"
        />
      </div>

      <div class="column is-one-third-fullhd is-one-third-widescreen is-half-desktop is-half-tablet is-12-mobile">
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
            accept="image/*"
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
          :disabled="documents.length === 0"
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
import { toast } from 'bulma-toast';
import { computed, onBeforeUnmount, onMounted, ref, useTemplateRef, watch, type PropType } from 'vue';
import { useRoute } from 'vue-router';

import ImageUploader from './ImageUploader.vue';

import c2c from '@/js/apis/c2c';
import { useGlobalProperties } from '@/js/composables/global-properties';
import uploadFile from '@/js/upload-file';
import type { C2cDocument } from '@/js/vue-plugins/document-utils';

type UploadedImage = {
  file: File;
  key: string;
  document: C2cDocument;
  dataUrl: string | null;
  percentCompleted: number;
  status: 'INITIAL' | 'SAVING' | 'SUCCESS' | 'FAILED';
  errorMessage: string | null;
};

const props = defineProps({
  lang: {
    type: String,
    required: true,
  },
  parentDocument: {
    type: Object as PropType<C2cDocument & { article_type?: string; activities?: string[] }>,
    required: true,
  },
});

const route = useRoute();
const { $documentUtils, $gettext, $language } = useGlobalProperties();

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

const documents = computed(() => Object.values(images.value).map((image) => image.document));

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
  images.value = {};
  categoriesEdition.value = false;
  promise.value = {};
  readyForSaving.value = false;
  dragOver.value = false;
}

function computeReadyForSaving() {
  const values = Object.values(images.value);
  readyForSaving.value = values.length !== 0 && values.every((image) => image.status === 'SUCCESS');
}

function onDeleteImage(image: UploadedImage) {
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
  };
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

function save() {
  const saved = documents.value;
  promise.value = c2c
    .createImages(saved)
    .then((response) => {
      // add result to parent, it will update page
      // we fake a valid img document with enough info to work
      props.parentDocument.associations!.images!.push(
        ...saved.map((img, idx) => ({
          ...img,
          document_id: response.data.images[idx].document_id,
          available_langs: [$language.current!],
        }))
      );
      clean();
      hide();
    })
    .catch(() => {
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

<style scoped lang="scss">
// TODO : modal background color with more alpha in Variables

.images-uploader {
  .images-uploader-message {
    position: relative;
    height: 315px;
    text-align: center;
    border: 5px dashed #ddd;
    background: #f8f8f8;
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
    background: #eee;
    border: 5px dashed #bbb;
  }

  .images-uploader-message-dragover {
    background: rgb(184, 238, 177);
    border: 5px dashed green;
  }
}
</style>
