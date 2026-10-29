<template>
  <div class="box">
    <h4 class="title is-3">
      <router-link to="articles">
        <icon-article />
        {{ $filters.uppercaseFirstLetter($gettext('articles')) }}
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

<script setup lang="ts">
import { computed } from 'vue';

import DashboardArticleLink from './DashboardArticleLink.vue';

import c2c from '@/js/apis/c2c';
import type DocumentService from '@/js/apis/c2c/DocumentService';

const articlesPromise = (c2c.article as DocumentService).getAll({ limit: 5, qa: 'draft,great' });

const articles = computed(() => articlesPromise.data);
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
