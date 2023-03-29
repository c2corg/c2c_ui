<template>
  <div v-show="hasAnnouncement && !hidden" class="publication has-background-info has-text-white no-print">
    <div class="section is-info">
      <button class="delete" @click="hide" />
      <div ref="content" />
    </div>
  </div>
</template>

<script>
import forum from '@/js/apis/forum';

export default {
  name: 'BoardAnnouncementWidget',

  data() {
    return {
      hasAnnouncement: false,
      hidden: false,
      updatedAt: null,
    };
  },

  computed: {
    readdenPostKey: {
      get() {
        return this.$localStorage.get('readdenPostKey');
      },
      set(value) {
        this.$localStorage.set('readdenPostKey', value);
      },
    },
  },

  created() {
    this.loadBoardAnnouncement();
  },

  methods: {
    loadBoardAnnouncement() {
      forum.readBoardAnnouncement().then((response) => {
        const data = response['data'];
        if (data['tags'].indexOf('visible') > -1) {
          const post = data.post_stream.posts[data.posts_count - 1];

          this.updatedAt = post.updated_at;

          if (this.readdenPostKey === post.updated_at) {
            return;
          }

          this.hasAnnouncement = true;

          const content = document.createElement('div');
          content.innerHTML = post.cooked;
          this.$refs.content.appendChild(content);
        }
      });
    },

    hide() {
      this.hidden = true;
      this.readdenPostKey = this.updatedAt;
    },
  },
};
</script>

<style lang="scss">
.meta {
  display: none;
}

.publication {
  //display: block;
  position: relative;
  margin-bottom: $size-7;

  a,
  a:hover {
    color: currentColor;
    text-decoration: underline;
  }
}
</style>

<style scoped lang="scss">
.delete {
  position: absolute;
  top: $size-7;
  right: $size-7;
}
</style>
