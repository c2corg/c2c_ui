<template>
  <div class="box">
    <h4 class="title is-3">
      <router-link to="articles">
        <icon-article />
        {{ $gettext('articles') | uppercaseFirstLetter }}
      </router-link>
    </h4>
    <loading-notification :promise="articlesPromise" />
    <ul class="dashboard-list">
      <li>
        <router-link :to="{ name: 'article', params: { id: 108793 } }" v-translate
          >Summary of camptocamp's articles</router-link
        >
      </li>
      <div v-if="articles != null">
        <dashboard-article-link v-for="article of articles.documents" :key="article.document_id" :article="article" />
      </div>
    </ul>
    <hr />
    <h6 class="title is-6 has-text-centered">
      <router-link to="articles">
        <span v-translate>See more</span>
      </router-link>
    </h6>
  </div>
</template>

<script>
import DashboardArticleLink from './DashboardArticleLink';

import c2c from '@/js/apis/c2c';

export default {
  name: 'DashboardArticlesList',

  components: {
    DashboardArticleLink,
  },

  data() {
    return {
      articlesPromise: null,
    };
  },

  computed: {
    articles() {
      return this.articlesPromise?.data;
    },
  },

  created() {
    this.articlesPromise = c2c.article.getAll({ limit: 5 });
  },
};
</script>

<style scoped lang="scss">
ul {
  list-style-type: disc !important;
  padding-left: 12px;
}

h4 > a,
h6 > a,
li > a {
  color: #4a4a4a !important;
}

h4 > a:hover,
h6 > a:hover {
  color: #337ab7 !important;
}

.dashboard-list > a:nth-child(2n + 1) {
  background-color: #fbfaf6;
}
</style>
