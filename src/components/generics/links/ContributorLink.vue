<template>
  <span>
    <author-link :author="contributor" />
    (<router-link :to="{name: 'whatsnew', query: {u:contributor.user_id} }">c</router-link>)
  </span>
</template>

<script>
  export default {
    props: {
      contributor: {
        type: Object,
        required: true
      }
    }
  };
</script>
