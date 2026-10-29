<template>
  <edition-container :mode="mode" :document="document" :is-loading="saving" @save="save">
    <!-- shown once loaded, as the container is -->
    <template v-if="document">
      <div class="columns is-multiline">
        <form-field :document="document" :field="fields.title" is-expanded />
        <form-field class="is-narrow" :document="document" :field="fields.article_type" />
        <form-field class="is-12" :document="document" :field="fields.activities" />
        <form-field class="is-8" :document="document" :field="fields.categories" />
        <quality-field ref="quality" class="is-4" :document="document" />
        <form-field class="is-12" :document="document" :field="fields.summary" />
        <form-field class="is-12" :document="document" :field="fields.description" />
      </div>

      <associations-input-row :document="document" :field="fields.articles" />
      <associations-input-row :document="document" :field="fields.waypoints" />
      <associations-input-row :document="document" :field="fields.outings" />
      <associations-input-row :document="document" :field="fields.routes" />
      <associations-input-row :document="document" :field="fields.books" />

      <hr />
    </template>
  </edition-container>
</template>

<script setup lang="ts">
import { useTemplateRef } from 'vue';

import AssociationsInputRow from './utils/AssociationsInputRow.vue';
import EditionContainer from './utils/EditionContainer.vue';
import FormField from './utils/FormField.vue';
import QualityField from './utils/QualityField.vue';
import { useDocumentEdition } from './utils/document-edition';

const { fields, saving, mode, document, save } = useDocumentEdition({ beforeSave });

const quality = useTemplateRef<{ beforeSave(): void }>('quality');

function beforeSave() {
  quality.value!.beforeSave();
}
</script>
