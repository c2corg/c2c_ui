<template>
  <modal-card ref="modalWindow">
    <div slot="title" v-translate>Insert a link</div>
    <div class="field">
      <label class="label">
        {{ $gettext('text to display') | uppercaseFirstLetter }}
      </label>
      <div class="control">
        <input class="input" v-model="chunk" />
      </div>
    </div>
    <div class="field">
      <label class="label">
        {{ $gettext('URL') | uppercaseFirstLetter }}
      </label>
      <div class="control">
        <input class="input" v-model="url" />
      </div>
    </div>
    <div slot="footer" class="buttons">
      <button class="button is-success" @click="insert" v-translate>Insert link</button>
      <button class="button is-danger" @click="$refs.modalWindow.hide()" v-translate>Cancel</button>
    </div>
  </modal-card>
</template>

<script>
export default {
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
