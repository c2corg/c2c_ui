<template>
  <edition-container :mode="mode" :document="document" :is-loading="saving" @save="save">
    <!-- shown once loaded, as the container is -->
    <template v-if="document">
      <div class="columns is-multiline">
        <form-field class="is-12" :document="document" :field="fields.activities" />
        <form-field class="is-12" :document="document" :field="fields.categories" />
        <form-field class="is-12" :document="document" :field="fields.summary" />
        <form-field class="is-12" :document="document" :field="fields.description" />
      </div>

      <map-input-row :document="document" ref="map" />

      <hr />
    </template>
  </edition-container>
</template>

<script setup lang="ts">
import { useTemplateRef } from 'vue';

import EditionContainer from './utils/EditionContainer.vue';
import FormField from './utils/FormField.vue';
import MapInputRow from './utils/MapInputRow.vue';
import { useDocumentEdition, useFitMapOnFirstGeometry } from './utils/document-edition';

const { fields, saving, mode, document, save } = useDocumentEdition();

const map = useTemplateRef<InstanceType<typeof MapInputRow>>('map');
useFitMapOnFirstGeometry(document, map);
</script>
