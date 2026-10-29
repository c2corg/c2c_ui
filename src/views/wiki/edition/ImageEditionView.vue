<template>
  <edition-container :mode="mode" :document="document" :is-loading="saving || uploadingNewFile" @save="save">
    <!-- shown once loaded, as the container is -->
    <template v-if="document">
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
          <quality-field ref="quality" class="is-4" :document="document" />
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
    </template>
  </edition-container>
</template>

<script setup lang="ts">
import { ref, useTemplateRef } from 'vue';

import AssociationsInputRow from './utils/AssociationsInputRow.vue';
import EditionContainer from './utils/EditionContainer.vue';
import FormField from './utils/FormField.vue';
import FormSection from './utils/FormSection.vue';
import MapInputRow from './utils/MapInputRow.vue';
import QualityField from './utils/QualityField.vue';
import { useDocumentEdition, useFitMapOnFirstGeometry } from './utils/document-edition';

import { useGlobalProperties } from '@/js/composables/global-properties';
import uploadFile from '@/js/upload-file';

const { $user } = useGlobalProperties();

const { fields, saving, mode, document, save } = useDocumentEdition({ beforeSave, afterLoad });

const newVersionSource = ref<string | null>(null);
const uploadingNewFile = ref(false);

const map = useTemplateRef<InstanceType<typeof MapInputRow>>('map');
const quality = useTemplateRef<{ beforeSave(): void }>('quality');

useFitMapOnFirstGeometry(document, map);

function beforeSave() {
  quality.value!.beforeSave();
}

function afterLoad() {
  const image = document.value!;
  fields.value.image_type.values = (fields.value.image_type.values as string[])
    .filter(
      // The copyright option should be only accessible to moderators,
      // and if the image is associated to a book.
      // It's meant for book covers only
      (value) =>
        value !== 'copyright' ||
        image.image_type === 'copyright' ||
        ($user.isModerator && image.associations!.books!.length)
    )
    .filter(
      // Only moderators can change a picture which is collaborative to personal
      (value) => value !== 'personal' || image.image_type === 'personal' || $user.isModerator
    );
}

function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files![0];

  if (!file) {
    return;
  }

  uploadingNewFile.value = true;

  uploadFile(
    file,
    undefined as unknown as number,
    (dataUrl) => {
      newVersionSource.value = dataUrl;
    },
    () => {
      /* onUploadProgress */
    },
    (uploaded) => {
      uploadingNewFile.value = false;

      if (uploaded.geometry) {
        (uploaded.geometry as { version?: number }).version = document.value!.geometry!.version;
      }
      Object.assign(document.value!, uploaded);
    },
    () => {
      /* onUploadFailure */
      uploadingNewFile.value = false;
    }
  );

  input.value = '';
}
</script>
