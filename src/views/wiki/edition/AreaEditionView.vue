<template>
  <edition-container :mode="mode" :document="document" :is-loading="saving" @save="save">
    <!-- shown once loaded, as the container is -->
    <template v-if="document">
      <div class="columns">
        <form-field :document="document" :field="fields.title" />
        <form-field class="is-narrow" :document="document" :field="fields.area_type" />
      </div>
      <map-input-row v-if="$user.isModerator" :document="document" geom-detail-editable />
      <div class="columns is-multiline">
        <form-field class="is-12" :document="document" :field="fields.summary" />
        <form-field class="is-12" :document="document" :field="fields.description" />
        <quality-field class="is-4" :document="document" />
      </div>

      <hr />
    </template>
  </edition-container>
</template>

<script setup lang="ts">
import EditionContainer from './utils/EditionContainer.vue';
import FormField from './utils/FormField.vue';
import MapInputRow from './utils/MapInputRow.vue';
import QualityField from './utils/QualityField.vue';
import { useDocumentEdition } from './utils/document-edition';

import { useGlobalProperties } from '@/js/composables/global-properties';

const { $user } = useGlobalProperties();

const { fields, saving, mode, document, save } = useDocumentEdition({ beforeSave });

function beforeSave() {
  if (!$user.isModerator) {
    // need to delete geomtry : API won't allow any modification otherwise
    delete document.value!.geometry;
  }
}
</script>
