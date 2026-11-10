<template>
  <edition-container :mode="mode" :document="document" :is-loading="saving" @save="save">
    <!-- shown once loaded, as the container is -->
    <template v-if="document">
      <form-section
        :title="$gettext('general informations')"
        :sub-title="$gettext('Title of the book, author, language and date of publication.')"
      >
        <div class="columns is-multiline">
          <form-field class="is-12" :document="document" :field="fields.title" />
          <form-field class="is-12" :document="document" :field="fields.activities" />
          <form-field class="is-12" :document="document" :field="fields.book_types" />
          <form-field class="is-12" :document="document" :field="fields.langs" />
          <form-field class="is-4" :document="document" :field="fields.author" />
          <form-field class="is-4" :document="document" :field="fields.editor" />
          <form-field class="is-4" :document="document" :field="fields.publication_date" />
          <form-field class="is-4" :document="document" :field="fields.nb_pages" />
          <form-field class="is-4" :document="document" :field="fields.isbn" />
          <form-field class="is-4" :document="document" :field="fields.url" />
          <quality-field class="is-4" :document="document" />
        </div>
      </form-section>

      <form-section :title="$gettext('description')" :sub-title="$gettext('Book content')">
        <div class="columns is-multiline">
          <form-field class="is-12" :document="document" :field="fields.summary" />
          <form-field class="is-12" :document="document" :field="fields.description" />
        </div>
      </form-section>

      <form-section
        :title="$gettext('associations')"
        :sub-title="$gettext('Articles, waypoints or routes to be linked.')"
      >
        <associations-input-row :document="document" :field="fields.articles" />
        <associations-input-row :document="document" :field="fields.waypoints" />
        <associations-input-row :document="document" :field="fields.routes" />
      </form-section>
    </template>
  </edition-container>
</template>

<script setup lang="ts">
import AssociationsInputRow from './utils/AssociationsInputRow.vue';
import EditionContainer from './utils/EditionContainer.vue';
import FormField from './utils/FormField.vue';
import FormSection from './utils/FormSection.vue';
import QualityField from './utils/QualityField.vue';
import { useDocumentEdition } from './utils/document-edition';

const { mode, fields, saving, document, save } = useDocumentEdition();
</script>
