<template>
  <div class="box">
    <h4 class="title is-3">
      <router-link to="forum">
        <icon-forum />
        {{ $gettext('Forum') }}
      </router-link>
    </h4>
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
          <!-- no avatar when the last poster is missing from the users of the answer -->
          <img
            v-if="topic.last_poster_user"
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
    <hr />
    <h6 class="title is-6 has-text-centered">
      <router-link to="forum">
        <span v-translate>See more</span>
      </router-link>
    </h6>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import forum from '@/js/apis/forum';

// a topic of the latest ones, as the widget reads it
type Topic = {
  id: number;
  slug: string;
  title: string;
  highest_post_number: number;
  last_poster_username: string;
  last_poster_user?: { username: string; avatar_template: string };
};

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

const props = defineProps({
  wide: {
    type: Boolean,
    default: false,
  },
  messageCount: {
    type: Number,
    default: -1,
  },
});

const promise = forum.getLatest(EXCLUDED_CATEGORIES);

const topics = computed(() => {
  if (!promise.data) {
    return null;
  }

  let topics = promise.data.topic_list.topics as Topic[];

  if (props.messageCount >= 0) {
    topics = topics.slice(0, props.messageCount);
  }

  return topics;
});

const imgSize = computed(() => (props.wide ? 24 : 20));

function getAvatarUrl(user: { avatar_template: string }) {
  return forum.getAvatarUrl(user, imgSize.value);
}

function getTopicUrl(topic: Topic) {
  return `${forum.url}/t/${topic.slug}/${topic.id}/${topic.highest_post_number}`;
}
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

h4 > a,
h6 > a {
  color: $color-text !important;
}

h4 > a:hover,
h6 > a:hover {
  color: $color-link !important;
}
</style>
