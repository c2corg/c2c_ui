<template>
  <section>
    <div class="columns">
      <div class="column is-12-mobile" v-if="!canStartAgain">
        <div class="subtitle" v-translate>todo : texte descriptif</div>
        <div class="columns">
          <div class="column is-12-mobile">
            <div>
              <p class="link-header" v-translate>All in store for you:</p>
              <ul>
                <li>
                  <router-link to="" v-translate>- todo : des liens vers d'autres contenus</router-link>
                </li>
                <li>
                  <router-link to="" v-translate>- todo : des liens vers d'autres contenus</router-link>
                </li>
                <li>
                  <router-link to="" v-translate>- todo : des liens vers d'autres contenus</router-link>
                </li>
                <li>
                  <router-link to="" v-translate>- todo : des liens vers d'autres contenus</router-link>
                </li>
              </ul>
            </div>
          </div>
          <div class="column is-12-mobile">
            <p class="petzl-header" v-translate>todo : Ce dispositif est soutenu par la fondation Petzl</p>
            <router-link :to="{ name: '/' }" class="menu-brand has-text-centered">
              <img src="@/assets/img/logo_asso.svg" alt="Fondation Petzl" class="logo-fondation-petzl" />
            </router-link>
          </div>
        </div>
      </div>
      <div class="column is-12-mobile" v-if="canStartAgain">
        <button @click="() => $emit('change-view', 'form')">recommencer une recherche</button>
      </div>
    </div>
  </section>
</template>

<script>
export default {
  name: 'ItinevertBanner',
  props: {
    canStartAgain: {
      type: Boolean,
      default: false,
    },
  },
};
</script>

<style scoped lang="scss">
.link-header,
.petzl-header {
  font-weight: 600;
}

.petzl-header {
  text-align: center;
}

.logo-fondation-petzl {
  max-width: 20%;
  display: block;
  margin-left: auto;
  margin-right: auto;
}

@media screen and (max-width: $tablet) {
  .logo-fondation-petzl {
    max-width: 10%;
  }
}
</style>
