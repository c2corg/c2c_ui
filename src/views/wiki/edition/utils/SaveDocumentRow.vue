<template>
  <div class="columns is-mobile">
    <div class="column is-narrow">
      <div class="control">
        <button
          class="button is-primary"
          :class="{'is-loading':isLoading}"
          @click="$emit('save', comment)"
          v-translate>
          Save
        </button>
      </div>
    </div>
    <div class="column">
      <div class="control is-expanded">
        <input
          v-model="comment"
          type="text"
          class="input"
          :disabled="mode !== 'edit'"
          :placeholder="$gettext('comment')">
      </div>
    </div>
    <div class="column is-narrow">
      <button class="button" @click="$emit('preview')">
        <fa-icon icon="eye" />
        <span>&nbsp;</span>
        <span v-translate>Preview</span>
      </button>
    </div>
  </div>
</template>

<script>
  export default {
    props: {
      isLoading: {
        type: Boolean,
        required: true
      }
    },

    data() {
      return {
        comment: ''
      };
    },

    computed: {
      mode() {
        return this.$route.name.split('-')[1]; // right part of route name : add or edit
      }
    }
  };
</script>
