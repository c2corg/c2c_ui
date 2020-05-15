<template>
  <modal-window ref="modalWindow" small has-transparent-shader is-danger>
    <ul>
      <li v-for="(message, i) of messages" :key="i">
        {{ message }}
      </li>
    </ul>
  </modal-window>
</template>

<script>
export default {
  data() {
    return {
      messages: null,
    };
  },

  methods: {
    show(messages) {
      this.messages = messages;
      this.$refs.modalWindow.show();
    },
  },
};
</script>
