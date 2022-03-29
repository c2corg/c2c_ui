<template>
  <div :class="{ wide: wide }">
    <loading-notification :promise="promise" />
    <div v-if="topics">
      <a
        class="forum-row"
        v-for="topic of topics"
        :key="topic.id"
        :href="getTopicUrl(topic)"
        target="_blank"
        rel="noopener"
        :title="topic.last_poster_username"
      >
        <img
          :src="getAvatarUrl(topic.last_poster_user)"
          :style="'width:' + imgSize + 'px'"
          loading="lazy"
          alt="Avatar"
        />
        <span :class="{ 'is-ellipsed': !wide }">
          {{ topic.title }}
        </span>
      </a>
    </div>
  </div>
</template>

<script>
import forum from '@/js/apis/forum';

export default {
  props: {
    wide: {
      type: Boolean,
      default: false,
    },
    messageCount: {
      type: Number,
      default: -1,
    },
  },

  data() {
    return {
      promise: null,
    };
  },

  computed: {
    topics() {
      if (!this.promise.data) {
        return null;
      }

      let topics = this.promise.data.topic_list.topics;

      if (this.messageCount >= 0) {
        topics = topics.slice(0, this.messageCount);
      }

      return topics;
    },
    imgSize() {
      return this.wide ? 24 : 20;
    },
  },

  created() {
    this.promise = forum.getLatestContributeurs();
  },

  methods: {
    getAvatarUrl(user) {
      return forum.getAvatarUrl(user, this.imgSize);
    },

    getTopicUrl(topic) {
      return `${forum.url}/t/${topic.slug}/${topic.id}/${topic.highest_post_number}`;
    },
  },
};
</script>

<style scoped lang="scss">
.forum-row {
  display: flex;
  color: $text;
  padding-bottom: 0.2rem;

  img {
    border-radius: 50%;
    vertical-align: top;
    height: 100%;
    flex-shrink: 0;
  }

  span {
    vertical-align: top;
  }
}

.forum-row:hover {
  background: $hover-background;
}

.wide {
  .forum-row {
    padding: 1rem;
    border-bottom: 1px solid #eee;

    img {
      margin-right: 0.5rem;
    }
  }
}

:not(.wide) {
  span {
    padding-left: 0.5rem;
  }
}
</style>
