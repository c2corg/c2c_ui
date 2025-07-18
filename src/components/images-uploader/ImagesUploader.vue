<template>
  <modal-card ref="modalWindow" class="images-uploader" wide>
    <div class="columns is-multiline images-uploader-files">
      <div
        v-for="(image, key) of images"
        :key="key"
        class="column is-one-third-fullhd is-one-third-widescreen is-half-desktop is-half-tablet is-12-mobile"
      >
        <image-uploader
          :categories-edition="categoriesEdition"
          :status="image.status"
          :data-url="image.dataUrl"
          :percent-completed="image.percentCompleted"
          :document="image.document"
          :is-initial="image.status === 'INITIAL'"
          :is-saving="image.status === 'SAVING'"
          :is-success="image.status === 'SUCCESS'"
          :is-failed="image.status === 'FAILED'"
          :can-rotate="image.file && image.file.name && !image.file.name.endsWith('.svg')"
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

    <div slot="footer" class="buttons">
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
  </modal-card>
</template>

<script>
import ImageUploader from './ImageUploader';

import c2c from '@/js/apis/c2c';
import uploadFile from '@/js/upload-file';

export default {
  components: {
    ImageUploader,
  },

  props: {
    lang: {
      type: String,
      required: true,
    },
    parentDocument: {
      type: Object,
      required: true,
    },
  },

  data() {
    return {
      images: {},
      categoriesEdition: false,
      promise: {},
      readyForSaving: false,
      dragOver: false,
    };
  },

  computed: {
    imageType() {
      if (this.parentDocument.type === 'o' || this.parentDocument.type === 'u' || this.parentDocument.type === 'x') {
        return 'personal';
      }

      if (this.parentDocument.type === 'c') {
        return this.parentDocument.article_type === 'collab' ? 'collaborative' : 'personal';
      }

      return 'collaborative';
    },

    documents() {
      const documents = [];

      for (const image of Object.values(this.images)) {
        documents.push(image.document);
      }

      return documents;
    },

    associationsArrayName() {
      return this.$documentUtils.getAssociationArrayName(this.parentDocument);
    },
  },

  watch: {
    // this component saves its state. It allows an user to close window
    // with unsaved images, and re-open it without loosing its images
    //
    // Here is the issue:
    // if the user starts an image load, then closes the window without saving
    // and goes to another page, the component won't be reloaded
    // and loaded images could be accessible from the next document
    // so, if $route changes, we must clean
    $route: 'clean',
  },

  mounted() {
    window.addEventListener('dragover', this.preventDrag, false);
    window.addEventListener('drop', this.preventDrag, false);
  },

  beforeDestroy() {
    window.removeEventListener('dragover', this.preventDrag);
    window.removeEventListener('drop', this.preventDrag);
  },

  methods: {
    preventDrag(event) {
      if (event.target !== this.$refs.fileInput) {
        event.preventDefault();
      }
    },

    show() {
      this.$refs.modalWindow.show();
    },

    hide() {
      this.$refs.modalWindow.hide();
    },

    clean() {
      this.images = {};
      this.categoriesEdition = false;
      this.promise = {};
      this.readyForSaving = false;
      this.dragOver = false;
    },

    onDeleteImage(image) {
      if (this.images[image.key]) {
        this.$delete(this.images, image.key);
      }

      this.computeReadyForSaving();
    },

    onFilesChange(event) {
      for (const file of event.target.files) {
        const key = file.name + '#' + file.lastModified;

        if (this.images[key] === undefined) {
          const image = this.buildImageObject(file, key);

          this.$set(this.images, image.key, image);
          this.startUpload(image);
        }
      }

      // clean HTML input : if user delete upload, and re-upload same image
      event.target.value = '';
      this.computeReadyForSaving();
    },

    // build an object that ships all data needed for one file to upload :
    // file : OS file object to upload
    // key : unique key that identify it
    // document : c2c document that will be saved once the file is uploaded
    // dataUrl : raw representation of the image (used in HTML src attribute)
    // status : INITIAL, SAVING, SUCCESS or FAILED
    // percentCompleted : no comment :)
    // errorMessage : not yet used ?
    buildImageObject(file, key) {
      const document = this.$documentUtils.buildDocument('image', this.lang);
      document.activities = this.parentDocument.activities ? this.parentDocument.activities.slice(0) : [];
      document.geometry.geom = this.parentDocument.geometry ? this.parentDocument.geometry.geom : null;
      document.file_size = file.size;
      document.image_type = this.imageType;
      document.quality = 'medium';
      document.associations[this.associationsArrayName] = [{ document_id: this.parentDocument.document_id }];

      return {
        file,
        key,
        document,
        dataUrl: null,
        percentCompleted: 0,
        status: 'INITIAL',
        errorMessage: null,
      };
    },

    startUpload(image, angle = 0) {
      image.status = 'INITIAL';
      image.percentCompleted = 0;

      uploadFile(
        image.file,
        angle,
        /*onDataUrlReady =*/ (dataUrl) => {
          image.dataUrl = dataUrl;
        },
        (event) => {
          this.onUploadProgress(event, image);
        },
        (document) => {
          this.onUploadSuccess(document, image);
        },
        (event) => {
          this.onUploadFailure(event, image);
        }
      );
    },

    onUploadProgress(event, image) {
      image.status = 'SAVING';
      if (event.total !== 0) {
        image.percentCompleted = Math.floor((event.loaded * 100) / event.total);
      }
    },

    onUploadSuccess(document, image) {
      image.status = 'SUCCESS';

      Object.assign(image.document, document);
      this.computeReadyForSaving();
    },

    onUploadFailure(event, image) {
      image.percentCompleted = 100;
      image.status = 'FAILED';
      image.errorMessage = event?.message ?? this.$gettext('Image could not be processed');
    },

    onRotateImage(image, angle) {
      this.startUpload(image, angle);
      this.computeReadyForSaving();
    },

    computeReadyForSaving() {
      const images = Object.values(this.images);
      this.readyForSaving = images.length && images.every((image) => image.status === 'SUCCESS');
    },

    save() {
      this.promise = c2c
        .createImages(this.documents)
        .then((response) => {
          // add result to parent, it will update page
          // we fake a valid img document with enough info to work
          this.parentDocument.associations.images.push(
            ...this.documents.map((img, idx) => ({
              ...img,
              document_id: response.data.images[idx].document_id,
              available_langs: [this.$language.current],
            }))
          );
          this.clean();
          this.hide();
        })
        .catch(() => {
          this.clean();
          this.hide();
          toast({
            message: this.$gettext(`An error occurred, couldn't save images`),
            type: 'is-danger',
          });
        });
    },
  },
};
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
