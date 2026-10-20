<template>
  <modal-card ref="modalWindow">
    <template #title>
      <div v-translate>Insert a link</div>
    </template>
    <div class="field">
      <label class="label">
        {{ $filters.uppercaseFirstLetter($gettext('text to display')) }}
      </label>
      <div class="control">
        <input class="input" v-model="chunk" />
      </div>
    </div>
    <div class="field">
      <label class="label">
        {{ $filters.uppercaseFirstLetter($gettext('URL')) }}
      </label>
      <div class="control">
        <input class="input" v-model="url" />
      </div>
    </div>
    <template #footer>
      <div class="buttons">
        <button class="button is-success" @click="insert" v-translate>Insert link</button>
        <button class="button is-danger" @click="$refs.modalWindow.hide()" v-translate>Cancel</button>
      </div>
    </template>
  </modal-card>
</template>

<script>
export default {
  emits: ['insert'],

  data() {
    return {
      chunk: '',
      url: '',
    };
  },

  methods: {
    show(chunk, url) {
      this.chunk = chunk ?? this.$gettext('text to display');
      this.url = url ?? 'https:\\\\';
      this.$refs.modalWindow.show();
    },
    insert() {
      this.$emit('insert', this.chunk, this.url);
      this.$refs.modalWindow.hide();
    },
  },
};
</script>
