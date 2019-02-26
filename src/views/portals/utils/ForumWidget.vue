<template>
  <div :class="{wide:wide}">
    <loading-notification :promise="promise" />
    <div v-if="topics" >
      <a
        class="forum-row"
        v-for="topic of topics"
        :key="topic.id"
        :href="getTopicUrl(topic)"
        target="_blank"
        :title="topic.last_poster_username">
        <img
          :src="getAvatarUrl(topic.last_poster_user)"
          :style="'width:' + imgSize + 'px'">
        <span>
          {{ topic.title }}
        </span>
      </a>
    </div>
  </div>
</template>

<script>
  import forum from '@/js/apis/forum.js';

  const DOCUMENT_COMMENT_CATEGORY_ID = 29;

  export default {

    props: {
      wide: {
        type: Boolean,
        default: false
      },
      messageCount: {
        type: Number,
        default: -1
      }
    },

    data() {
      return {
        promise: null
      };
    },

    computed: {
      topics() {
        if (!this.promise.data) {
          return null;
        }

        let topics = this.promise.data.topic_list.topics;

        topics = topics.filter((topic) => topic.category_id !== DOCUMENT_COMMENT_CATEGORY_ID);

        if (this.messageCount >= 0) {
          topics = topics.slice(0, this.messageCount);
        }

        return topics;
      },
      imgSize() {
        return this.wide ? 24 : 20;
      }
    },

    created() {
      this.promise = forum.getLatest();
    },

    methods: {
      getAvatarUrl(user) {
        const template = user.avatar_template.startsWith('/') ? forum.url + user.avatar_template : user.avatar_template;
        return template.replace('{size}', this.imgSize);
      },

      getTopicUrl(topic) {
        return `${forum.url}/t/${topic.slug}/${topic.id}/${topic.highest_post_number}`;
      }
    }
  };
</script>

<style scoped lang="scss">

  @import '@/assets/sass/variables.scss';

  .forum-row{
    display:block;
    color:$text;
    padding-bottom:0.2rem;

    img {
      border-radius: 50%;
      vertical-align: bottom;
    }

    span{
      vertical-align: top
    }
  }

  .forum-row:hover{
    background: $hover-background;
  }

  .wide{

    .forum-row{
      padding:1rem;
      border-bottom: 1px solid #EEE;
      font-weight:bold;

      img {
        margin-right: 0.5rem;
      }
    }
  }
</style>
