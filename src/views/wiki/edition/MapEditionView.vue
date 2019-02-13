<template>
  <edition-container
    :mode="mode"
    :document="document"
    :generic-errors="genericErrors"
    :is-loading="saving"
    @save="save">
    <div class="columns is-multiline">
      <form-field class="is-12" :document="document" :field="fields.title"/>
      <form-field class="is-4" :document="document" :field="fields.editor" />
      <form-field class="is-4" :document="document" :field="fields.scale" />
      <form-field class="is-4" :document="document" :field="fields.code" />
    </div>

    <hr>
  </edition-container>
</template>

<script>

  import DocumentEditionViewMixin from './utils/DocumentEditionViewMixin';

  export default {

    mixins: [ DocumentEditionViewMixin ]
  };

</script>
