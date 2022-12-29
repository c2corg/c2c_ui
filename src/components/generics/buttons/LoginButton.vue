<template>
  <router-link v-show="!$user.isLogged" :to="{ name: 'auth', query: { redirect } }" class="button is-primary">
    <slot>
      <span v-translate>Login</span>
    </slot>
  </router-link>
</template>

<script>
export default {
  data() {
    return {
      redirect: '/',
    };
  },

  watch: {
    $route: {
      handler(to) {
        this.redirect = to.fullPath;
      },
      immediate: true,
    },
  },
};
</script>
