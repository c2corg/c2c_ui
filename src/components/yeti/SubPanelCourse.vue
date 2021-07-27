<template>
  <div class="yeti-subpanel">
    <sub-panel-title><span v-translate>Route</span></sub-panel-title>
    <div v-if="features.length">
      <div class="columns is-mobile">
        <div class="column">
          <p class="features-title">
            <icon-route class="icon document-icon" />
            <fa-icon icon="pen" class="icon edit-icon" />
            <span
              v-show="!hasFeaturesTitle"
              class="features-title-text features-title-placeholder"
              @click="onEditNewFeaturesTitle"
              v-translate
            >
              Add title…
            </span>
            <span
              v-show="hasFeaturesTitle"
              class="features-title-text features-title-content"
              ref="featuresTitle"
              tabindex="0"
              contenteditable
              spellcheck="false"
              @blur="onEditFeaturesTitle"
              @keypress.13.prevent
              >{{ featuresTitle }}</span
            >
          </p>
        </div>
        <div class="column is-narrow">
          <button class="button is-secondary is-small" @click="onRemoveFeatures">
            <fa-icon icon="trash" class="trash-icon" />
            <span v-translate>Delete route</span>
          </button>
        </div>
      </div>
      <div class="ml-5 mb-5">
        <p class="yetiform-info is-italic is-marginless" v-translate>Lines chunks</p>
        <features-list :features="features" />
      </div>
      <sub-panel-title><span v-translate>Export</span></sub-panel-title>
      <div class="columns is-vcentered is-mobile">
        <div class="column">
          <ul class="form-export">
            <li v-for="type of formats" :key="type" class="control is-flex">
              <input
                :id="'format' + type"
                type="radio"
                name="exportFormat"
                class="is-checkradio is-primary"
                :value="type"
                v-model="format"
              />
              <label :for="'format' + type">{{ type }}</label>
            </li>
          </ul>
        </div>
        <div class="column is-narrow">
          <button class="button is-primary" @click="downloadCourse" v-translate>Export route</button>
        </div>
      </div>
      <div class="yetiform-note mt-5">
        <p v-translate>Drawing tips</p>
        <ul class="content-ul">
          <li><strong v-translate translate-context="yeti">Draw</strong> <span v-translate>new lines chunks</span></li>
          <li>
            <strong v-translate translate-context="yeti">Delete</strong>
            <span v-translate>last point with the Backspace key</span>
          </li>
        </ul>
        <p v-translate>On a drawn line</p>
        <ul class="content-ul">
          <li>
            <strong v-translate translate-context="yeti">Edit</strong> <span v-translate>points by moving them</span>
          </li>
          <li>
            <strong v-translate translate-context="yeti">Create</strong>
            <span v-translate>a new point on an existing line</span>
          </li>
          <li><strong v-translate>Delete a point</strong> <span v-translate>with Alt + clic</span></li>
        </ul>
        <p v-translate>From the interface</p>
        <ul class="content-ul">
          <li><strong v-translate>Delete a line chunk</strong></li>
          <li><strong v-translate>Delete route</strong> <span v-translate>to start or load a new one</span></li>
        </ul>
      </div>
    </div>
    <div v-else>
      <p v-translate>No route right now</p>
      <div class="load-gpx">
        <button
          class="button is-primary"
          :class="{ 'is-loading': loading }"
          :disabled="loading"
          @click="onLoadGpx"
          v-translate
        >
          Upload a GPS track
        </button>
        <div class="control upload-button">
          <input ref="gpxFileInput" type="file" @change="uploadGpx" accept=".gpx" />
        </div>
        <div class="yetiform-note mt-5">
          <p><strong v-translate>Draw right on the map</strong> <span v-translate>to start a new route</span></p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { format } from 'date-fns';

import FeaturesList from '@/components/yeti/FeaturesList.vue';
import SubPanelTitle from '@/components/yeti/SubPanelTitle.vue';
import { $yetix } from '@/components/yeti/yetix';
import ol from '@/js/libs/ol';
import utils from '@/js/utils';

export default {
  components: { FeaturesList, SubPanelTitle },
  props: {
    features: {
      type: Array,
      default: null,
    },
    featuresTitle: {
      type: String,
      default: null,
    },
  },
  data() {
    return {
      newFeaturesTitle: false,
      loading: false,
      formats: ['GPX', 'KML'],
      format: 'GPX',
    };
  },
  computed: {
    hasFeaturesTitle() {
      return !(!this.featuresTitle.length && !this.newFeaturesTitle);
    },
  },
  mounted() {
    $yetix.$on('featuresTitle', (featuresTitle) => {
      this.$emit('update:featuresTitle', featuresTitle);
    });
  },
  methods: {
    onEditFeaturesTitle(e) {
      if (!e.target.innerText.length) {
        this.newFeaturesTitle = false;
      }
      this.$emit('update:featuresTitle', e.target.innerText);
    },
    onEditNewFeaturesTitle() {
      this.newFeaturesTitle = true;
      this.$nextTick(() => {
        this.$refs.featuresTitle.focus();
      });
    },
    onLoadGpx() {
      this.$refs.gpxFileInput.click();
    },
    onRemoveFeatures() {
      if (confirm(this.$gettext('Confirm delete'))) {
        $yetix.$emit('removeFeatures');
      }
    },
    uploadGpx(event) {
      this.loading = true;

      const reader = new FileReader();

      reader.onload = () => {
        this.loading = false;
        this.$emit('gpx', reader.result);
      };

      reader.readAsText(event.target.files[0]);

      // empty the input, because if user wan't to upload same trace
      // change event is not fired
      // and emit gpx event
      this.$refs.gpxFileInput.value = '';
      this.$emit('gpx', null);
    },
    downloadCourse() {
      if (this.format === 'GPX') {
        this.downloadFeatures(new ol.format.GPX(), '.gpx', 'application/gpx+xml');
      } else if (this.format === 'KML') {
        this.downloadFeatures(new ol.format.KML(), '.kml', 'application/vnd.google-earth.kml+xml');
      }
    },
    downloadFeatures(olFormat, extension, mimetype) {
      const features = this.features;
      features[0].set('name', this.featuresTitle);

      const filename = this.setFilename(extension);

      const content = olFormat.writeFeatures(features, {
        featureProjection: 'EPSG:3857',
      });

      utils.download(content, filename, mimetype + ';charset=utf-8');
    },
    setFilename(ext) {
      return format(new Date(), 'yyyy-MM-dd_HH-mm-ss') + ext;
    },
  },
};
</script>

<style scoped lang="scss">
.features-title {
  display: flex;
  line-height: 1.4;

  &-text {
    min-width: 100px;
    border: solid 1px transparent;
    border-radius: 2px;
    padding: 2px 2em 2px 2px;
    box-decoration-break: clone;

    &:hover,
    &:focus {
      border-color: #b5b5b5;
    }
  }

  &-placeholder {
    font-style: italic;
  }

  &-content {
    font-weight: bold;
  }
}

.icon {
  margin-top: 2px;
}

.edit-icon {
  order: 1;
  opacity: 0;
  margin-left: -1.5em;
  pointer-events: none;
  transform: scale(0.75);
}

.features-title:hover .edit-icon {
  opacity: 0.75;
}

.document-icon {
  margin-right: 3px;
}

.trash-icon {
  margin-right: 3px;
}

.upload-button {
  position: relative;
}

input[type='file'] {
  opacity: 0; /* invisible but it's there! */
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  cursor: pointer;
}

.load-gpx {
  margin-top: 2rem;
}

.form-export {
  display: flex;
}

.control {
  align-items: center;

  .is-checkradio[type='radio'] + label {
    line-height: 1.2rem;
  }
}

@media screen and (max-width: 350px) {
  .form-export {
    display: block;
  }
}
</style>
