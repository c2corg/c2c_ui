<template>
  <router-link
    v-show="!$user.isLogged"
    :to="{name:'auth'}"
    class="button is-primary">
    <slot>
      <span v-translate>Login</span>
    </slot>
  </router-link>
</template>
