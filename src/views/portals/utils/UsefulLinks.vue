<template>
  <div class="box">
    <h4 class="title is-3">
      <router-link :to="{ name: 'article', params: { id: 107228 } }" v-translate>Useful links</router-link>
    </h4>
    <div>
      <ul>
        <li>
          <router-link :to="{ name: 'article', params: { id: 107228 } }" v-translate>Préparer sa course</router-link>
        </li>
        <li>
          <router-link :to="{ name: 'yeti' }" v-translate
            >Yeti : un outil pour évaluer le risque d’avalanche</router-link
          >
        </li>
        <li>
          <a href="https://www.metaskirando.ovh/" title="Metaskirando" v-translate
            >Metaskirando : aggrégateur de sorties ski en Europe</a
          >
        </li>
        <li>
          <router-link :to="{ name: 'serac' }" v-translate>SERAC : accidents et incidents en montagne</router-link>
        </li>
      </ul>
      <ul>
        <li>
          <router-link :to="{ name: 'article', params: { id: 106726 } }" v-translate
            >Camptocamp Association</router-link
          >
        </li>
        <li>
          <a href="https://www.helloasso.com/associations/camptocamp-association/" title="Helloasso" v-translate
            >Donate or join us</a
          >
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped lang="scss">
ul {
  list-style-type: disc !important;
  padding-left: 12px;
}

h4 {
  padding-bottom: 0.7rem !important;
  margin-bottom: 0.7rem !important;
  border-bottom: 1px solid #ddd;
}

li:hover {
  background: $hover-background;
}

h4 > a,
li > a {
  color: #4a4a4a !important;
}

h4 > a:hover {
  color: #337ab7 !important;
}
</style>
