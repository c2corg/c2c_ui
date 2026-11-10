<template>
  <edition-container :mode="mode" :document="document" :is-loading="saving" @save="save">
    <!-- shown once loaded, as the container is -->
    <template v-if="document">
      <div class="columns is-multiline">
        <form-field class="is-12" :document="document" :field="fields.title" />
        <form-field class="is-4" :document="document" :field="fields.editor" />
        <form-field class="is-4" :document="document" :field="fields.scale" />
        <form-field class="is-4" :document="document" :field="fields.code" />
      </div>

      <hr />
    </template>
  </edition-container>
</template>

<script setup lang="ts">
import EditionContainer from './utils/EditionContainer.vue';
import FormField from './utils/FormField.vue';
import { useDocumentEdition } from './utils/document-edition';

const { mode, fields, saving, document, save } = useDocumentEdition();
</script>
