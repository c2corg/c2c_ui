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
        <router-link :to="{ name: 'article', params: { id: 108793 } }" v-translate>
          Summary of camptocamp's articles
        </router-link>
      </li>
      <div v-if="articles">
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

  created(query = {}) {
    query.limit = 5;
    query.qa = 'draft,great';
    this.articlesPromise = c2c.article.getAll(query);
  },
};
</script>

<style scoped lang="scss">
ul {
  list-style-type: disc !important;
  padding-left: $size-6;
}

h4 > a,
h6 > a,
li > a {
  color: $color-text !important;
}

h4 > a:hover,
h6 > a:hover {
  color: $color-link !important;
}

.dashboard-list > a:nth-child(2n + 1) {
  background-color: $body-background-color;
}
</style>
