<template>
  <edition-container
    :mode="mode"
    :document="document"
    :generic-errors="genericErrors"
    :is-loading="saving"
    @save="save">

    <form-section
      :title="$gettext('general informations')"
      :sub-title="$gettext('Title of the book, author, language and date of publication.')">
      <div class="columns is-multiline">
        <form-field class="is-12" :document="document" :field="fields.title"/>
        <form-field class="is-12" :document="document" :field="fields.activities"/>
        <form-field class="is-12" :document="document" :field="fields.book_types" />
        <form-field class="is-12" :document="document" :field="fields.langs" />
        <form-field class="is-4" :document="document" :field="fields.author" />
        <form-field class="is-4" :document="document" :field="fields.editor" />
        <form-field class="is-4" :document="document" :field="fields.publication_date" />
        <form-field class="is-4" :document="document" :field="fields.nb_pages" />
        <form-field class="is-4" :document="document" :field="fields.isbn" />
        <form-field class="is-4" :document="document" :field="fields.url" />
      </div>

    </form-section>

    <form-section
      :title="$gettext('description')"
      :sub-title="$gettext('Book content')">
      <div class="columns is-multiline">
        <form-field class="is-12" :document="document" :field="fields.summary"/>
        <form-field class="is-12" :document="document" :field="fields.description"/>
      </div>
    </form-section>

    <form-section
      :title="$gettext('associations')"
      :sub-title="$gettext('Articles, waypoints or routes to be linked.')">
      <associations-input-row :document="document" :field="fields.articles" />
      <associations-input-row :document="document" :field="fields.waypoints" />
      <associations-input-row :document="document" :field="fields.routes" />
    </form-section>

  </edition-container>
</template>

<script>

  import documentEditionViewMixin from './utils/document-edition-view-mixin';

  export default {
    mixins: [ documentEditionViewMixin ]
  };

</script>
