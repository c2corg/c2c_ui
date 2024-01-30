<template>
  <div class="card">
    <div class="card-image img-container" :style="dataUrl ? 'background-image: url(' + dataUrl + ')' : ''">
      <div class="action-buttons">
        <delete-button @click="$emit('delete-image')" :title="$gettext('Delete image')" />
        <rotate-button
          @click="applyRotation(90)"
          :disabled="rotateClicked || disabled"
          :title="$gettext('Rotate image right')"
          v-if="canRotate"
        />
        <rotate-button
          direction="left"
          @click="applyRotation(-90)"
          :disabled="rotateClicked || disabled"
          :title="$gettext('Rotate image left')"
          v-if="canRotate"
        />
      </div>
      <progress
        v-if="isSaving || isFailed"
        class="progress is-large"
        :class="{
          'is-success': isSuccess,
          'is-warning': isSaving,
          'is-danger': isFailed,
        }"
        :value="percentCompleted"
        max="100"
      >
        {{ percentCompleted }}%
      </progress>
    </div>

    <div class="card-content">
      <div v-if="!isFailed">
        <div v-if="categoriesEdition" class="columns is-mobile is-multiline is-gapless category-select">
          <div v-for="item of imageCategories" :key="item" class="column is-4">
            <label class="checkbox">
              <input type="checkbox" :checked="document.categories.includes(item)" @input="toggleCategory(item)" />
              {{ $gettext(item, 'image_categories') | uppercaseFirstLetter }}
            </label>
          </div>
        </div>

        <div v-else>
          <div class="field title-input">
            <div class="control">
              <input type="text" :placeholder="$gettext('title')" v-model="document.locales[0].title" maxlength="150" />
            </div>
          </div>

          <div class="columns is-mobile is-gapless licence-select">
            <div
              v-for="[licence, label] in Array.from(licences)"
              class="column has-text-centered"
              :class="{
                'has-background-success': document.image_type == licence,
                'is-4': licences.size === 3,
                'is-6': licences.size === 2,
              }"
              :key="licence"
              @click="setLicence(licence)"
            >
              <label>{{ licences.length }} {{ label | uppercaseFirstLetter }}</label>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="buttons is-centered buttons-if-failed">
        <button @click="$emit('retry-upload')" class="button is-primary" v-translate>Retry</button>
        <button @click="$emit('delete-image')" class="button is-danger" v-translate>Cancel</button>
      </div>
    </div>
  </div>
</template>

<script>
// https://github.com/c2corg/v6_ui/blob/master/c2corg_ui/static/js/imageuploader.js
import RotateButton from './RotateButton';

import constants from '@/js/constants';

export default {
  components: {
    RotateButton,
  },
  props: {
    categoriesEdition: {
      type: Boolean,
      required: true,
    },
    dataUrl: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      required: true,
    },
    percentCompleted: {
      type: Number,
      required: true,
    },
    document: {
      type: Object,
      required: true,
    },
    isInitial: {
      type: Boolean,
      required: true,
    },
    isSaving: {
      type: Boolean,
      required: true,
    },
    isSuccess: {
      type: Boolean,
      required: true,
    },
    isFailed: {
      type: Boolean,
      required: true,
    },
    canRotate: {
      type: Boolean,
      default: false,
    },
  },

  data() {
    const result = {
      licences: new Map([
        ['collaborative', this.$gettext('collab')],
        ['personal', this.$gettext('personal')],
      ]),
      rotate: 0,
      rotateClicked: false,
    };

    if (this.$user.isModerator) {
      result.licences.set('copyright', this.$gettext('copyright'));
    }

    return result;
  },

  computed: {
    imageCategories() {
      return constants.objectDefinitions.image.fields.categories.values;
    },

    disabled() {
      return this.isSaving || this.isFailed;
    },
  },

  watch: {
    isSaving: function () {
      this.rotateClicked = false;
    },
    isFailed: function () {
      this.rotateClicked = false;
    },
  },

  methods: {
    toggleCategory(category) {
      const newValue = this.document.categories.slice(0);

      if (!newValue.includes(category)) {
        newValue.push(category);
      } else {
        newValue.splice(newValue.indexOf(category), 1);
      }

      this.document.categories = newValue;
    },

    setLicence(licence) {
      this.document.image_type = licence;
      this.$emit('set-default-licence');
    },

    applyRotation(angle) {
      if (this.rotateClicked || this.disabled) {
        return;
      }
      this.rotateClicked = true;
      this.rotate = (this.rotate + angle) % 360;
      if (this.rotate < 0) {
        this.rotate += 360;
      }
      this.$emit('rotate-image', this.rotate);
    },
  },
};
</script>

<style scoped lang="scss">
@import '~bulma/sass/utilities/initial-variables.sass';

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

  progress {
    position: absolute;
    bottom: 0;
  }
}

.card-content {
  height: 115px;
  overflow-y: hidden;
  padding: 0;

  .category-select {
    padding: 0.5rem;

    label {
      display: inherit;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      user-select: none;
    }
  }

  .title-input {
    margin-bottom: 0;

    input {
      padding: 19px 0.5rem;
      border: 0;
      outline: 0;
      display: block;
      width: 100%;
      font-size: 1rem;
    }
  }

  .licence-select {
    border-top: 1px solid #ddd;
    max-width: 100%;

    .column:not(:last-child) {
      border-right: 1px solid #ddd;
    }

    label {
      padding: 19px 0.5rem;
      display: inherit;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      cursor: pointer;
      user-select: none;
    }
  }
}

.action-buttons {
  position: absolute;
  top: -1rem;
  right: -1rem;
  font-size: 1.5rem;
  display: flex;
  flex-direction: column;

  > * {
    margin-bottom: 5px;
  }
}

.buttons-if-failed {
  margin-top: 3em;
}
</style>
