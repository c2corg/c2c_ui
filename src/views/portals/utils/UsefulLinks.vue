<template>
  <div class="box">
    <h4 class="title is-3">
      <router-link :to="{ name: 'article', params: { id: 107228 } }" v-translate>Useful links</router-link>
    </h4>
    <div>
      <ul>
        <li>
          <router-link :to="{ name: 'article', params: { id: 107228 } }" v-translate>
            Get ready for your climb
          </router-link>
        </li>
        <li>
          <router-link :to="{ name: 'yeti' }" v-translate>Yeti: a tool to assess the avalanche risk</router-link>
        </li>
        <li>
          <a href="https://www.metaskirando.ovh/" title="Metaskirando" v-translate>
            Metaskirando: an aggregator of ski outings in Europe
          </a>
        </li>
        <li>
          <router-link :to="{ name: 'serac' }" v-translate>
            SERAC: accidents and incidents in the mountains
          </router-link>
        </li>
        <li>
          <router-link :to="{ name: 'article', params: { id: 106726 } }" v-translate>
            Camptocamp Association
          </router-link>
        </li>
        <li>
          <a href="https://www.helloasso.com/associations/camptocamp-association/" title="Helloasso" v-translate>
            Want to join us? Or donate?
          </a>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
ul {
  list-style-type: disc !important;
  padding-left: var(--c2c-size-6);
}

h4 {
  padding-bottom: var(--c2c-size-7) !important;
  margin-bottom: var(--c2c-size-7) !important;
}

li:hover {
  background: var(--c2c-hover-background);
}

h4 > a,
li > a {
  color: var(--c2c-color-text) !important;
}

h4 > a:hover {
  color: var(--c2c-color-link) !important;
}
</style>
