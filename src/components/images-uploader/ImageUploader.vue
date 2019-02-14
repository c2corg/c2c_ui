<template>
  <div class="card">
    <div class="card-image img-container" :style="'background-image: url(' + image.src + ')'">
      <delete-button
        :visible="isSuccess || isFailed"
        class="delete-button"
        @click="$emit('deleteImage', image)"/>

      <progress
        v-if="isSaving || isFailed"
        class="progress is-large"
        :class="{
          'is-success' : isSuccess,
          'is-warning' : isSaving,
          'is-danger' : isFailed}"
        :value="percentCompleted"
        max="100">
        {{ percentCompleted }}%
      </progress>

    </div>

    <div class="card-content">
      <div v-if="!isFailed">

        <div v-if="categoriesEdition" class="columns is-mobile is-multiline is-gapless category-select">
          <div v-for="item of imageCategories" :key="item" class="column is-4">
            <label class="checkbox" >
              <input
                type="checkbox"
                :checked="document.image_categories.includes(item)"
                @input="toggleCategory(item)">
              {{ $gettext(item, 'image_categories') | uppercaseFirstLetter }}
            </label>
          </div>
        </div>

        <div v-else>
          <div class="field title-input">
            <div class="control">
              <input
                type="text"
                :placeholder="$gettext('title')"
                v-model="document.locales[0].title">
            </div>
          </div>

          <div class="columns is-mobile is-gapless licence-select">
            <div
              v-for="[licence, label] in Array.from(licences)"
              class="column has-text-centered"
              :class="{'has-background-success': document.image_type==licence, 'is-4':licences.size===3, 'is-6':licences.size===2}"
              :key="licence"
              @click="document.image_type=licence">

              <label>{{ licences.length }} {{ label | uppercaseFirstLetter }}</label>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="buttons is-centered buttons-if-failed">
        <button
          @click="upload"
          class="button is-primary"
          v-translate>
          Retry
        </button>
        <button
          @click="$emit('deleteImage', image)"
          class="button is-danger"
          v-translate>
          Cancel
        </button>
      </div>
    </div>
  </div>

</template>

<script>
  import loadImage from 'blueimp-load-image';

  // https://github.com/c2corg/v6_ui/blob/master/c2corg_ui/static/js/imageuploader.js
  import c2c from '@/js/apis/c2c';
  import constants from '@/js/constants';
  import Worker from '@/js/Worker';

  const STATUS_INITIAL = 'Initial';
  const STATUS_SAVING = 'Saving';
  const STATUS_SUCCESS = 'Success';
  const STATUS_FAILED = 'Failed';

  const worker = new Worker();

  export default {

    props: {
      image: {
        type: Object,
        required: true
      },
      parentDocument: {
        type: Object,
        required: true
      },
      categoriesEdition: {
        type: Boolean,
        required: true
      }
    },

    data() {
      let result = {
        visibleDropdown: null,
        status: STATUS_INITIAL,
        percentCompleted: 0,
        errorMessage: null,

        licences: new Map([
          ['collaborative', this.$gettext('collab')],
          ['personal', this.$gettext('personal')]
        ])

      };

      if (this.$user.isModerator) {
        result.licences.set('copyright', this.$gettext('copyright'));
      }

      return result;
    },

    computed: {
      document() {
        return this.image.document;
      },
      imageCategories() {
        return constants.objectDefinitions.image.fields.categories.values;
      },
      isInitial() {
        return this.status === STATUS_INITIAL;
      },
      isSaving() {
        return this.status === STATUS_SAVING;
      },
      isSuccess() {
        return this.status === STATUS_SUCCESS;
      },
      isFailed() {
        return this.status === STATUS_FAILED;
      }
    },

    created() {
      let image = this.image;
      let upload = this.upload;

      // test files for orientation stuff :
      // https://github.com/recurser/exif-orientation-examples
      // and a very good article :
      // https://www.daveperrett.com/articles/2012/07/28/exif-orientation-handling-is-a-ghetto/

      // pre processing is mandatory. Reasons :
      // * file is rotated
      if (image.orientation !== 0 && image.file.type === 'image/jpeg') {
        loadImage(
          image.file,
          (canvas) => {
            image.src = canvas.toDataURL(image.file.type);
            canvas.toBlob(upload, image.file.type);
          },
          { canvas: true, orientation: image.orientation } // this will fix orientation from exif
        );
      } else {
        const reader = new FileReader();
        reader.onload = (e) => {
          image.src = e.target.result;
        };
        reader.readAsDataURL(image.file);

        upload(image.file);
      }
    },

    methods: {

      onUploadProgress(event) {
        if (event.total !== 0) {
          this.percentCompleted = Math.floor((event.loaded * 100) / event.total);
        }
      },

      onSuccess(event) {
        this.status = STATUS_SUCCESS;
        this.document.filename = event.data.filename;
        this.$emit('success');
      },

      onFailure(event) {
        this.percentCompleted = 100;
        this.status = STATUS_FAILED;
        this.errorMessage = event.message;
        this.$emit('fail', event);
      },

      upload(data) {
        this.percentCompleted = 0;
        this.status = STATUS_SAVING;
        worker.push(c2c.uploadImage.bind(c2c), data, this.onUploadProgress, this.onSuccess, this.onFailure);
      },

      toggleCategory(category) {
        let newValue = this.document.image_categories.slice(0);

        if (!newValue.includes(category)) {
          newValue.push(category);
        } else {
          newValue.splice(newValue.indexOf(category), 1);
        }

        this.document.image_categories = newValue;
      }
    }
  };
</script>

<style scoped lang="scss">

@import "~bulma/sass/utilities/initial-variables.sass";

.img-container {
    width: 100%;
    height: 200px;
    transition: 0.2s;
    background-color: #e2e2e2;
    background-repeat: no-repeat;
    background-size: contain;
    background-position: center;
    position: relative;

    &:hover {
        // background-color: black;
        transition: 0.2s;

        .exif {
        background-color: rgba(83, 83, 83, 0.58);
        }

        .remove-image-btn,
        .exif p {
            opacity: 1;
            transition: 0.2s;
        }
    }

    progress{
        position:absolute;
        bottom:0;
    }
}

.card-content{
    height:115px;
    overflow-y: hidden;
    padding:0;

    .category-select{
        padding:0.5rem;

        label{
            display: inherit;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            user-select: none;
        }
    }

    .title-input{
        margin-bottom: 0;

        input{
            padding:19px 0.5rem;
            border:0;
            outline:0;
            display:block;
            width:100%;
            font-size:1rem;
        }
    }

    .licence-select{
        border-top: 1px solid #DDD;
        max-width: 100%;

        .column:not(:last-child){
            border-right: 1px solid #DDD;
        }

        label{
            padding:19px 0.5rem;
            display: inherit;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            cursor:pointer;
            user-select: none;
        }
    }
}

.delete-button{
    position:absolute;
    top:-1rem;
    right:-1rem;
    font-size:3rem;
}

.buttons-if-failed{
    margin-top: 3em;
}

 </style>
