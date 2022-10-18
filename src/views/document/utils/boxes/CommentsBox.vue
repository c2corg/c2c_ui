<template>
  <div v-if="isNormalView" class="box no-print">
    <h2 class="title is-2" v-translate>Comments</h2>

    <div v-if="document.disable_comments">
      <p v-translate>Comments are disabled.</p>
    </div>

    <div v-else-if="promise && promise.error" class="notification is-danger">
      <p>
        <span v-translate>Oups! Something went wrong with forum. Here is the message :</span>
        <br />
        {{ promise.error.message }}
      </p>
    </div>

    <div v-else>
      <div v-for="post of comments" :key="post.id" class="discourse-post">
        <div class="columns is-gapless">
          <div class="column is-narrow discourse-post-avatar">
            <img
              :src="getAvatarUrl(post)"
              alt="Avatar"
              :style="'width:' + $options.forumAvatarSize + 'px;height:' + $options.forumAvatarSize + 'px'"
              loading="lazy"
            />
          </div>
          <div class="column">
            <div class="discourse-post-header">
              <a
                :href="$options.forumUrl + '/users/' + post.username"
                :title="post.username"
                class="discourse-post-header-username"
              >
                {{ post.username }}
              </a>
              <span class="is-pulled-right">
                {{ $dateUtils.timeAgo(post['created_at']) }}
              </span>
            </div>

            <!-- eslint-disable-next-line vue/no-v-html -->
            <div class="discourse-content" v-html="post.cooked" />
          </div>
        </div>
      </div>

      <div class="has-text-centered">
        <login-button v-if="!$user.isLogged" key="not-logged" v-translate> Log in to post a comment </login-button>

        <!-- API bug with first comment creation? -->
        <button
          v-else-if="locale.topic_id === null"
          key="no-topic"
          class="button is-primary"
          @click="createTopic"
          :disabled="!$options.isProduction"
          v-translate
        >
          Post the first comment
        </button>

        <!-- Only the system comment exists -->
        <a
          v-else-if="comments.length === 0"
          key="no-comment"
          :href="discussionUrl"
          class="button is-primary"
          v-translate
        >
          Post the first comment
        </a>
        <a v-else-if="allCommentDisplayed" key="all-displayed" :href="discussionUrl" class="button is-primary">
          <span v-translate>Continue the discussion</span>
        </a>
        <a v-else key="some-displayed" :href="discussionUrl" class="button is-primary">
          <span v-translate>View next comments and continue the discussion</span>
        </a>
      </div>
    </div>
  </div>
</template>

<script>
import c2c from '@/js/apis/c2c';
import forum from '@/js/apis/forum';
import config from '@/js/config';
import { requireDocumentProperty } from '@/js/properties-mixins';
import viewModeMixin from '@/js/view-mode-mixin';

const computeCooked = function (cooked) {
  cooked = cooked.replace(/<a class="mention" href="/g, '<a class="mention" href="' + forum.url);

  return cooked;
};

export default {
  isProduction: config.isProduction,

  mixins: [requireDocumentProperty, viewModeMixin],

  data() {
    return {
      promise: {},
    };
  },

  computed: {
    locale() {
      return this.document.cooked;
    },

    discussionUrl() {
      if (!this.topic) {
        return null;
      }

      return forum.url + '/t/' + this.topic.slug + '/' + this.locale.topic_id + '/' + this.topic.posts_count;
    },

    topic() {
      return this.promise.data;
    },

    comments() {
      const result = [];

      if (!this.topic || !this.topic.post_stream) {
        return result;
      }

      const data = this.topic.post_stream;

      let posts = data.posts;

      if (posts[0].name === 'system') {
        posts = posts.slice(1);
      }

      for (const post of posts) {
        post.cooked = computeCooked(post.cooked);
        result.push(post);
      }

      return result;
    },

    allCommentDisplayed() {
      if (!this.topic || !this.topic.post_stream || !this.topic.posts_count) {
        return true;
      }
      return this.topic.post_stream.posts.length >= this.topic.posts_count;
    },
  },

  forumUrl: forum.url,
  forumAvatarSize: 45,

  created() {
    this.getComments();
  },

  methods: {
    createTopic() {
      const document_id = this.document.document_id;
      const lang = this.locale.lang;

      // create topic must go threw c2c API, because system has to create
      // first message with good link
      c2c.forum
        .createTopic(document_id, lang)
        .then((response) => {
          const topic_id = response['data']['topic_id'];
          const url = forum.url + '/t/' + document_id + '_' + lang + '/' + topic_id;
          window.location = url;
        })
        .catch((error) => {
          if (error.response && error.response.status === 400) {
            const topic_id = error.response['data']['errors'][0]['topic_id'];
            if (topic_id !== undefined) {
              this.locale.topic_id = topic_id;
              this.getComments();
            }
          }
        });
    },

    getComments() {
      if (this.locale.topic_id) {
        this.promise = forum.getTopic(this.locale.topic_id);
      }
    },

    getAvatarUrl(user) {
      return forum.getAvatarUrl(user, this.$options.forumAvatarSize);
    },
  },
};
</script>

<style lang="scss">
.discourse-post {
  border-top: 6px solid $color-base-c2c;
  margin-bottom: 1.5rem;
}

.discourse-post-avatar img {
  margin: 15px 15px 15px 0;
  border-radius: 4px;
}

.discourse-post-header {
  background: #e4e4e4;
  padding: 4px 10px 4px;
}

.discourse-post-header-username {
  font-weight: bold;
}

.discourse-content {
  margin-top: 0.5rem;

  .emoji {
    width: 20px;
    height: 20px;
    vertical-align: middle;
  }

  blockquote {
    background-color: #f0efeb;
    border-left: 5px solid #e9e9e9;
    border-left-color: #d0d0d0;
  }

  .quote {
    margin-top: 1em;
    margin-bottom: 1em;

    .title,
    blockquote {
      background-color: #f0efeb;
      border-left: 5px solid #e9e9e9;
      border-left-color: #d0d0d0;
    }

    .title {
      padding: 12px 12px 1px 12px;
      margin-bottom: 0;
    }

    blockquote {
      margin-top: 0;
      margin-left: 0;
      margin-right: 0;
      padding: 12px;
    }
  }

  h2 {
    margin: 30px 0 10px;
    font-size: 1.5em;
    font-weight: bold;
  }
}
</style>

<style lang="scss" scoped>
.button {
  white-space: normal;
  height: auto;
}
</style>
