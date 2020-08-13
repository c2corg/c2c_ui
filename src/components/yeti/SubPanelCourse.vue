<template>
  <div class="yeti-subpanel panelCourse">
    <subPanelTitle>Trace</subPanelTitle>
    <div v-if="features.length">
      <div class="columns is-mobile">
        <div class="column">
          <p class="features-title">
            <icon-route class="document-icon" />
            <strong>{{ featuresTitle }}</strong>
          </p>
        </div>
        <div class="column is-narrow">
          <button class="button is-secondary is-small" @click="onRemoveFeatures">Supprimer la trace</button>
        </div>
      </div>
      <div class="ml-5 mb-5">
        <p class="yetiform-info is-italic is-marginless">Portions de lignes</p>
        <featuresList :features="features" :map="map" />
      </div>
      <subPanelTitle>Export</subPanelTitle>
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
          <button class="button is-primary" @click="downloadCourse">Exporter la trace</button>
        </div>
      </div>
      <div class="yetiform-note mt-5">
        <p>Astuces</p>
        <ul class="content-ul">
          <li><strong>Dessinez</strong> de nouvelles portions de lignes</li>
          <li><strong>Éditez</strong> les points en les déplaçant</li>
          <li><strong>Créez</strong> un nouveau point sur une ligne existante</li>
          <li><strong>Supprimez un point</strong> avec Alt + clic</li>
          <li><strong>Supprimez une portion de ligne</strong></li>
          <li><strong>Supprimez la trace</strong> pour en charger une nouvelle</li>
        </ul>
      </div>
    </div>
    <div v-else>
      <p>Pas de traces actuellement</p>
      <div class="load-gpx">
        <button
          class="button is-primary"
          :class="{ 'is-loading': loading }"
          :disabled="loading"
          @click="onLoadGpx"
          v-translate
        >
          Charger un fichier GPX
        </button>
        <div class="control upload-button">
          <input ref="gpxFileInput" type="file" @change="uploadGpx" accept=".gpx" />
        </div>
        <div class="yetiform-note mt-5">
          <p>Ou <strong>dessinez directement sur la carte</strong> pour créer une nouvelle course</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import featuresList from '@/components/yeti/FeaturesList.vue';
import subPanelTitle from '@/components/yeti/SubPanelTitle.vue';
import ol from '@/js/libs/ol';
import utils from '@/js/utils';

export default {
  components: { featuresList, subPanelTitle },
  props: {
    map: {
      type: Object,
      default: null,
    },
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
      loading: false,
      formats: ['GPX', 'KML'],
      format: 'GPX',
    };
  },
  methods: {
    onLoadGpx() {
      this.$refs.gpxFileInput.click();
    },

    onRemoveFeatures() {
      if (confirm('Confirmez la suppression ?')) {
        this.map.removeFeatures();
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

    downloadCourse(event) {
      if (this.format === 'GPX') {
        this.downloadFeatures(new ol.format.GPX(), '.gpx', 'application/gpx+xml');
      } else if (this.format === 'KML') {
        this.downloadFeatures(new ol.format.KML(), '.kml', 'application/vnd.google-earth.kml+xml');
      }
    },

    downloadFeatures(format, extension, mimetype) {
      const features = this.features;
      features[0].set('name', this.featuresTitle);

      const filename = 'export' + Date.now() + extension;

      const content = format.writeFeatures(features, {
        featureProjection: 'EPSG:3857',
      });

      utils.download(content, filename, mimetype + ';charset=utf-8');
    },
  },
};
</script>

<style scoped lang="scss">
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

.document-icon {
  margin-right: 3px;
}

.features-title {
  padding: 0.15em 0;
  line-height: 1.4;
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
