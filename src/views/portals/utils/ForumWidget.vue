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

const EXCLUDED_CATEGORIES = [
  // https://forum.camptocamp.org/c/comments
  // document's comments
  29,

  // https://forum.camptocamp.org/c/petites-annonces
  // offers (petites annonces in french)
  40, // ski surf snowshoeing gears
  41, // ice, snow, mixt gears
  42, // climnbing gears
  43, // Misc gears
  44, // other offers
  45, // professionals

  // https://forum.camptocamp.org/c/apres-l-effort/partenaires
  // tinder for camptocamp ? ;)
  47,

  // https://forum.camptocamp.org/c/apres-l-effort/bistrot
  // all but subjects about mountain...
  54,

  // https://forum.camptocamp.org/c/archives/le-site-suggestions-bugs-et-problemes
  // Old V5 site's bugs reporting
  55,

  // https://forum.camptocamp.org/c/site-et-association/moderation-forums-topoguide-articles
  // Forum moderation
  56,

  // https://forum.camptocamp.org/c/site-et-association/traduction
  // traduction issues
  64,

  // https://forum.camptocamp.org/c/partenaires/partenaires-ski-surf-raquette-randonnee-trai
  // ski buddy finder
  94,

  // https://forum.camptocamp.org/c/partenaires/partenaires-escalade-sae
  // climbing buddy finder
  95,

  // https://forum.camptocamp.org/c/partenaires/co-voiturage
  // car-pooling
  96,

  // https://forum.camptocamp.org/c/petites-annonces/perdu-trouve
  // have you find/lost something in the moutain ? it's here!
  97,

  // https://forum.camptocamp.org/c/partenaires/partenaires-alpinisme-cascade-de-glace
  // mountaineering buddy finder
  113,

  // https://forum.camptocamp.org/c/site-et-association/v6-suggestions-bugs-et-problemes
  // Site's bugs reporting
  136,

  // https://forum.camptocamp.org/c/site-et-association/appli-mobile-suggestions-bugs
  // mobile application bugs reporting
  146,
];

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
      if (!this.promise?.data) {
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
    this.promise = forum.getLatest(EXCLUDED_CATEGORIES);
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
