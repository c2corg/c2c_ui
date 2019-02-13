<template>
  <div :class="{wide:wide}">
    <loading-notification :promise="promise" />
    <div v-if="topics" >
      <a
        class="forum-row"
        v-for="topic of topics.topics.slice(0, messageCount<0 ? 9999 : messageCount)"
        :key="topic.id"
        v-if="topic.category_id !== 29"
        :href="$options.forumUrl + '/t/' + topic.slug + '/' + topic.id + '/' + topic.highest_post_number"
        target="_blank"
        :title="topic.last_poster_username">
        <img
          :src="$options.forumUrl + topic.last_poster_user.avatar_template.replace('{size}',imgSize)"
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

    forumUrl: forum.url,

    computed: {
      topics() {
        return this.promise.data ? this.promise.data.topic_list : null;
      },
      imgSize() {
        return this.wide ? 24 : 20;
      }
    },

    created() {
      this.promise = forum.getLatest();
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
