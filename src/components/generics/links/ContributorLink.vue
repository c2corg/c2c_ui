<template>
  <span>
    <router-link :to="{name:'profile', params:{id:contributor.user_id}}">
      {{ contributor.name }}
    </router-link>
    <span v-if="showWhatsnew">
      (<router-link :to="{name: 'whatsnew', query: {u:contributor.user_id} }">c</router-link>)
    </span>
  </span>
</template>

<script>
  export default {
    props: {
      contributor: {
        type: Object,
        required: true
      },
      showWhatsnew: {
        type: Boolean,
        default: false
      }
    }
  };
</script>
