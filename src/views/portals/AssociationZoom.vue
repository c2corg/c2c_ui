<template>
  <section>
    <div ref="header" />
    <div ref="content" />
  </section>
</template>

<script>
import forum from '@/js/apis/forum';

export default {
  name: 'AssociationZoom',

  data() {
    return {
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
  },
};
</script>
