<template>
  <div class="yeti-subpanel">
    <sub-panel-title><span v-translate>Route</span></sub-panel-title>
    <div class="route-buttons">
      <edit-mode-button is-small icon-only />
      <span v-if="features.length">
        <button class="button is-secondary is-small" :title="$gettext('Delete route')" @click="onRemoveFeatures">
          <fa-icon icon="trash" />
          <span v-translate class="is-sr-only">Delete route</span>
        </button>
        <button class="button is-secondary is-small" :title="$gettext('Fit map to route')" @click="fitMapToFeatures">
          <fa-icon icon="location-crosshairs" />
          <span v-translate class="is-sr-only">Fit map to route</span>
        </button>
      </span>
    </div>
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
      </div>
      <div class="ml-5 mb-5">
        <p class="is-size-7 is-italic mb-1 has-text-grey" v-translate>Lines chunks</p>
        <features-list :features="features" />
      </div>
      <dropdown-content class="mb-5">
        <span v-translate>Elevation profile</span>
        <template #content>
          <elevation-profile :features="features" />
        </template>
      </dropdown-content>
      <simplify-tool ref="simplifyTool" />
    </div>
    <div v-else class="columns is-vcentered is-mobile">
      <div class="column">
        <p v-translate class="mb-2">No route right now</p>
      </div>
    </div>

    <sub-panel-title><span v-translate>Winter routes</span></sub-panel-title>
    <div v-if="winterRouteLayer" class="columns is-vcentered is-mobile">
      <div class="column">
        <input-checkbox v-model="winterRouteLayer.checked" @change="winterRouteLayer.action">
          <span v-translate>Visible layer</span>
        </input-checkbox>
        <component :is="winterRouteLayer.contentComponent" v-if="winterRouteLayer.checked" class="mt-2" />
      </div>
    </div>

    <div v-if="features.length">
      <sub-panel-title><span v-translate key="export">Export</span></sub-panel-title>
      <div class="columns is-vcentered is-mobile">
        <div class="column">
          <ul class="form-export">
            <li v-for="f of formats" :key="f" class="control is-flex">
              <input
                :id="'format' + f"
                type="radio"
                name="exportFormat"
                class="is-checkradio is-primary"
                :value="f"
                v-model="format"
              />
              <label :for="'format' + f">{{ f }}</label>
            </li>
          </ul>
        </div>
        <div class="column is-narrow">
          <button
            class="button is-primary"
            :class="{ 'is-disabled': validSimplifyTolerance }"
            @click="downloadCourse"
            v-translate
          >
            Export route
          </button>
        </div>
      </div>
    </div>

    <div v-else>
      <sub-panel-title><span v-translate key="import">Import</span></sub-panel-title>
      <div class="buttons">
        <button
          class="button is-primary mr-2"
          :class="{ 'is-loading': loading }"
          :disabled="loading"
          @click="onLoadGpx"
          v-translate
        >
          Upload a GPS track
        </button>
      </div>
      <div class="control upload-button">
        <input ref="gpxFileInput" type="file" @change="uploadGpx" accept=".gpx" />
      </div>
    </div>

    <hr />

    <info type="help">
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
        <li><strong v-translate>Split a line</strong> with Ctrl + clic</li>
      </ul>
      <p v-translate>From the interface</p>
      <ul class="content-ul">
        <li><strong v-translate>Delete a line chunk</strong></li>
        <li><strong v-translate>Delete route</strong> <span v-translate>to start or load a new one</span></li>
      </ul>
    </info>
  </div>
</template>

<script>
import DropdownContent from '@/components/yeti/DropdownContent.vue';
import EditModeButton from '@/components/yeti/EditModeButton.vue';
import ElevationProfile from '@/components/yeti/ElevationProfile.vue';
import FeaturesList from '@/components/yeti/FeaturesList.vue';
import Info from '@/components/yeti/Info.vue';
import SimplifyTool from '@/components/yeti/SimplifyTool.vue';
import SubPanelTitle from '@/components/yeti/SubPanelTitle.vue';
import Yetix from '@/components/yeti/Yetix';
import ol from '@/js/libs/ol';
import utils from '@/js/utils';

export default {
  components: {
    DropdownContent,
    EditModeButton,
    ElevationProfile,
    FeaturesList,
    Info,
    SimplifyTool,
    SubPanelTitle,
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
    editMode() {
      return Yetix.editMode;
    },
    features() {
      return Yetix.features;
    },
    featuresTitle() {
      return Yetix.featuresTitle;
    },
    validSimplifyTolerance() {
      return Yetix.validSimplifyTolerance;
    },
    hasFeaturesTitle() {
      return !(!this.featuresTitle.length && !this.newFeaturesTitle);
    },
    winterRouteLayer() {
      return Yetix.overlaysLayersSelector.filter((layer) => layer.id === 'winter-route')[0];
    },
  },
  methods: {
    onEditFeaturesTitle(e) {
      if (!e.target.innerText.length) {
        this.newFeaturesTitle = false;
      }
      Yetix.setFeaturesTitle(e.target.innerText);
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
        Yetix.$emit('removeFeatures');
        // initialize simplify tool (go back to init state)
        this.$refs.simplifyTool.initialize();
      }
    },
    uploadGpx(event) {
      this.loading = true;

      const reader = new FileReader();

      reader.onload = () => {
        this.loading = false;
        Yetix.$emit('gpx', reader.result);
      };

      reader.readAsText(event.target.files[0]);

      // empty the input, because if user wants to upload same trace
      // change event is not fired
      // and emit gpx event
      this.$refs.gpxFileInput.value = '';
      Yetix.$emit('gpx', null);
    },
    downloadCourse() {
      if (this.validSimplifyTolerance) {
        return window.alert(this.$gettext('Action is disabled. You must confirm simplified geometry first.'));
      }
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
        decimals: 7,
      });

      utils.download(content, filename, mimetype + ';charset=utf-8');
    },
    setFilename(ext) {
      return this.$dateUtils.toLocalizedString(new Date(), 'YYYY-MM-DD_HH-mm-ss') + ext;
    },
    setEditMode() {
      Yetix.setEditMode(!this.editMode);
    },
    fitMapToFeatures() {
      Yetix.$emit('fit-map-to-features');
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

.buttons {
  line-height: 2.5rem;
}

.route-buttons {
  position: absolute;
  right: 0;
  top: 0.75rem;
  z-index: 1;
}
</style>
