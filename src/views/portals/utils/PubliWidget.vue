<template>
  <div class="section">
    <div ref="content" />
  </div>
</template>

<script>
import forum from '@/js/apis/forum';

export default {
  name: 'PubliWidget',

  created() {
    this.loadPubli();
  },

  methods: {
    loadPubli() {
      forum.readPubli().then((response) => {
        const data = response['data'];
        if (data['tags'].indexOf('visible') > -1) {
          const post = data.post_stream.posts[0];

          const content = document.createElement('div');
          content.innerHTML = post.cooked;
          this.$refs.content.appendChild(content);
        }
      });
    },
  },
};
</script>

<style lang="scss">
.meta {
  display: none;
}
</style>
