<template>
  <edition-container :mode="mode" :document="document" :is-loading="saving || uploadingNewFile" @save="save">
    <form-section
      :title="$gettext('general informations')"
      :sub-title="$gettext('Title, activity and characteristics of the picture')"
    >
      <div class="columns is-multiline">
        <form-field :document="document" :field="fields.title" />
        <form-field class="is-narrow" :document="document" :field="fields.image_type" />
        <form-field class="is-12" :document="document" :field="fields.activities" />
        <form-field class="is-4" :document="document" :field="fields.author" />
        <form-field class="is-narrow" :document="document" :field="fields.date_time" />
        <form-field class="is-12" :document="document" :field="fields.categories" />

        <div class="column is-6">
          <form-field no-wrapper :document="document" :field="fields.filename" />
          <form-field no-wrapper :document="document" :field="fields.file_size" />
          <form-field no-wrapper :document="document" :field="fields.height" />
          <form-field no-wrapper :document="document" :field="fields.width" />
        </div>
        <div v-if="mode === 'edit' && document" class="column is-6 has-text-centered">
          <div class="field">
            <div class="file is-centered">
              <label class="file-label">
                <input class="file-input" type="file" name="resume" @change="onFileChange" accept="image/*" />
                <span class="file-cta button" :class="{ 'is-loading': uploadingNewFile }">
                  <span class="file-icon">
                    <fa-icon icon="upload" />
                  </span>
                  <span class="file-label" v-translate>Upload a new version</span>
                </span>
              </label>
            </div>
          </div>
          <img v-if="newVersionSource" :src="newVersionSource" />
          <thumbnail v-else :img="document" size="MI" />
        </div>
      </div>
    </form-section>

    <form-section :title="$gettext('geolocation')" :sub-title="$gettext('Precise localisation of the shooting')">
      <div class="columns is-multiline">
        <form-field class="is-6" :document="document" :field="fields.elevation" />
      </div>

      <map-input-row :document="document" ref="map" />
    </form-section>

    <form-section :title="$gettext('camera settings')" :sub-title="$gettext('Parameters of the Digital Camera')">
      <div class="columns is-multiline">
        <form-field class="is-4" :document="document" :field="fields.camera_name" />
        <form-field class="is-4" :document="document" :field="fields.fnumber" />
        <form-field class="is-4" :document="document" :field="fields.focal_length" />
        <form-field class="is-4" :document="document" :field="fields.exposure_time" />
        <form-field class="is-4" :document="document" :field="fields.iso_speed" />
      </div>
    </form-section>

    <form-section
      :title="$gettext('Detailed information')"
      :sub-title="$gettext('Open fields to detail the picture\'s context')"
    >
      <div class="columns is-multiline">
        <form-field class="is-12" :document="document" :field="fields.summary" />
        <form-field class="is-12" :document="document" :field="fields.description" />
        <quality-field ref="qualityField" class="is-4" :document="document" />
      </div>
    </form-section>

    <form-section
      :title="$gettext('associations')"
      :sub-title="$gettext('Articles, waypoints, routes or books to be linked.')"
    >
      <associations-input-row :document="document" :field="fields.articles" />
      <associations-input-row :document="document" :field="fields.waypoints" />
      <associations-input-row :document="document" :field="fields.routes" />
      <associations-input-row :document="document" :field="fields.books" />
    </form-section>
  </edition-container>
</template>

<script>
import documentEditionViewMixin from './utils/document-edition-view-mixin';

import uploadFile from '@/js/upload-file';

export default {
  mixins: [documentEditionViewMixin],

  data() {
    return {
      newVersionSource: null,
      uploadingNewFile: false,
    };
  },

  watch: {
    'document.geometry.geom': function (to, from) {
      if (from === null && to !== null) {
        this.$nextTick(() => {
          this.$refs.map.fitMapToDocuments();
        });
      }
    },
  },

  methods: {
    beforeSave() {
      this.$refs.qualityField.beforeSave();
    },

    afterLoad() {
      this.fields.image_type.values = this.fields.image_type.values
        .filter(
          // The copyright option should be only accessible to moderators,
          // and if the image is associated to a book.
          // It's meant for book covers only
          (value) =>
            value !== 'copyright' ||
            this.document.image_type === 'copyright' ||
            (this.$user.isModerator && this.document.associations.books.length)
        )
        .filter(
          // Only moderators can change a picture which is collaborative to personal
          (value) => value !== 'personal' || this.document.image_type === 'personal' || this.$user.isModerator
        );
    },

    onFileChange(event) {
      const file = event.target.files[0];

      if (!file) {
        return;
      }

      this.uploadingNewFile = true;

      uploadFile(
        file,
        undefined,
        (dataUrl) => {
          this.newVersionSource = dataUrl;
        },
        () => {
          /* onUploadProgress */
        },
        (document) => {
          this.uploadingNewFile = false;

          if (document.geometry) {
            document.geometry.version = this.document.geometry.version;
          }
          Object.assign(this.document, document);
        },
        () => {
          /* onUploadFailure */
          this.uploadingNewFile = false;
        }
      );

      event.target.value = '';
    },
  },
};
</script>
