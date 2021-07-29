<template>
  <span>
    <icon-moderator v-if="contributor.moderator" />
    <icon-blocked v-if="contributor.blocked" />
    <icon-robot v-if="contributor.robot" />
    <router-link :to="{ name: 'profile', params: { id: contributor.user_id } }">
      {{ contributor.name }}
    </router-link>
    <span>
      <span>(</span>
      <router-link :to="{ name: 'whatsnew', query: { u: contributor.user_id } }" rel="nofollow">c</router-link>
      <span v-if="contributor.forum_username">
        <span>|</span>
        <a :href="$options.forumUrl + '/users/' + contributor.forum_username + '/activity'">d</a>
      </span>
      <span>)</span>
    </span>
  </span>
</template>

<script>
import config from '@/js/config';

export default {
  forumUrl: config.urls.forum,
  props: {
    contributor: {
      type: Object,
      required: true,
    },
  },
};
</script>
