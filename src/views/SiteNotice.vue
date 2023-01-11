<template>
  <div
    v-show="hasAnnouncement && !hidden"
    class="site-notice has-background-info has-text-white no-print"
    @click="showContent = !showContent"
  >
    <div class="section is-info">
      <button class="delete" @click="hide" />
      <div ref="header" />
      <div v-show="showContent" ref="content" />
    </div>
  </div>
</template>

<script>
import forum from '@/js/apis/forum';

export default {
  name: 'SiteNotice',

  data() {
    return {
      hasAnnouncement: false,
      hidden: false,
      showContent: false,
      updatedAt: null,
      lang: this.$user.lang, // store lang, because if user changes lang after getting notice...
    };
  },

  computed: {
    readdenPostKey: {
      get() {
        return this.$localStorage.get('readdenPostKey.' + this.lang);
      },
      set(value) {
        this.$localStorage.set('readdenPostKey.' + this.lang, value);
      },
    },
  },

  created() {
    this.loadAnnouncement();
  },

  methods: {
    loadAnnouncement() {
      forum.readAnnouncement(this.lang).then((response) => {
        const data = response['data'];
        if (data['tags'].indexOf('visible') > -1) {
          const post = data.post_stream.posts[0];
          this.updatedAt = post.updated_at;

          if (this.readdenPostKey === post.updated_at) {
            return;
          }

          this.hasAnnouncement = true;

          // compute html, to split p
          const content = document.createElement('div');
          content.innerHTML = post.cooked;
          const paragraphs = content.getElementsByTagName('p');

          this.$refs.header.appendChild(paragraphs[0]);

          for (const p of Array.from(paragraphs).slice(1)) {
            this.$refs.content.appendChild(p);
          }
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
.site-notice {
  a,
  a:hover {
    color: currentColor;
    text-decoration: underline;
  }
}
</style>

<style scoped lang="scss">
.section {
  position: relative;
}

.delete {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
}
</style>
