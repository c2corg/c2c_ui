<template>
  <modal-window :has-close-button="false" ref="modalWindow">
    <div class="mb-4">
      <p v-if="!docType" v-translate>Do you really want to clear all saved documents?</p>
      <p v-else>
        <!-- $gettext('Do you really want do clear all saved routes?') -->
        <!-- $gettext('Do you really want do clear all saved outings?') -->
        <!-- $gettext('Do you really want do clear all saved waypoints?') -->
        <!-- $gettext('Do you really want do clear all saved articles?') -->
        <!-- $gettext('Do you really want do clear all saved images?') -->
        <!-- $gettext('Do you really want do clear all saved books?') -->
        <!-- $gettext('Do you really want do clear all saved xreports?') -->
        {{ $gettext('Do you really want do clear all saved ' + $documentUtils.getDocumentType(docType) + 's?') }}
      </p>
    </div>
    <div slot="footer" class="buttons is-flex is-justify-content-flex-end">
      <button class="button" @click="hide" v-translate>Cancel</button>
      <button class="button is-danger" @click="submit" v-translate>Delete all</button>
    </div>
  </modal-window>
</template>

<script>
export default {
  props: {
    docType: {
      type: String,
      default: undefined,
    },
  },

  methods: {
    show() {
      this.$refs.modalWindow.show();
    },

    hide() {
      this.$refs.modalWindow.hide();
    },

    submit() {
      this.$emit('delete');
      this.hide();
    },
  },
};
</script>
