<template>
  <div class="section">
    <h1 class="title is-1 has-text-centered">
      <router-link :to="{ name: 'article', params: { id: 1204369 } }"> Sophie Picture Contest </router-link>
    </h1>
    <div class="buttons is-centered">
      <router-link
        v-for="item of Object.values($options.years)"
        :key="item.year"
        :to="{ name: $route.name, params: { year: item.year } }"
        class="button"
        :class="{ 'is-primary': year === item.year }"
      >
        {{ item.year }}
      </router-link>
    </div>
    <div v-if="winners">
      <div class="columns">
        <div v-for="winner of winners" :key="winner.documentId" class="column">
          <div class="has-text-centered has-text-weight-bold title is-2">
            <fa-icon icon="star" class="star-icon" />
            {{ winner.category }}
          </div>
          <div class="has-text-centered">
            <img :src="getMediumImageUrl(winner.image)" class="winner-image" />
          </div>
          <div class="has-text-centered">
            <span class="is-italic"> {{ winner.title }}, </span>
            <span>
              {{ winner.author }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <hr class="separator"/>

    <h3 class="title is-2 has-text-centered" v-translate>
      Candidates
    </h3>
    <div class="cards-container is-flex" v-if="document">
      <document-link
        v-for="image in document.associations.images"
        :key="image.document_id"
        :document="image"
        :title="$documentUtils.getDocumentTitle(image)"
        class="card-image"
      >
        <img :src="getMediumImageUrl(image)" height="250" />
      </document-link>
    </div>
    <loading-notification v-else :promise="promise" />
  </div>
</template>

<script>
import c2c from '@/js/apis/c2c';
import imageUrls from '@/js/image-urls';

export default {
  data() {
    return {
      promise: null,
    };
  },

  years: {
    2009: { year: 2009, documentId: 187913, winners: null },
    2010: { year: 2010, documentId: 237549, winners: null },
    2011: { year: 2011, documentId: 300413, winners: null },
    2012: { year: 2012, documentId: 374949, winners: null },
    2013: { year: 2013, documentId: 465897, winners: null },
    2014: { year: 2014, documentId: 555996, winners: null },
    2015: { year: 2015, documentId: 673796, winners: null },
    2016: { year: 2016, documentId: 809627, winners: null },
    2017: { year: 2017, documentId: 937458, winners: null },
    2018: { year: 2018, documentId: 1058594, winners: null },
    2019: {
      year: 2019,
      documentId: 1154231,
      winners: [
        { title: 'The boy and the beast', author: 'Xav Le Fauve', image: { document_id: 1160645 }, category: 'Action' },
        {
          title: 'Aux aurores sur la Cresta Signal',
          author: 'Nicola Beltraminelli',
          image: { document_id: 1160247 },
          category: 'Paysage',
        },
        { title: 'Lavaredo', author: 'sambuco', image: { document_id: 1159569 }, category: 'Topoguide' },
      ],
    },
    2020: { year: 2020, documentId: 1251594, winners: null },
  },

  computed: {
    /*
     * properties that are deducted from URL
     */
    documentId() {
      return this.$options.years[this.year].documentId;
    },
    winners() {
      return this.$options.years[this.year].winners;
    },
    year() {
      return parseInt(this.$route.params.year, 10);
    },

    document() {
      if (!this.promise || !this.promise.data) {
        return null;
      }
      return this.promise.data;
    },
  },

  watch: {
    $route: {
      handler: 'loadDocument',
      immediate: true,
    },
  },

  methods: {
    loadDocument() {
      if (this.document && this.documentId === this.document.document_id) {
        return;
      }

      this.promise = c2c.article.get(this.documentId);
    },

    getMediumImageUrl: imageUrls.getMedium,
  },
};
</script>

<style scoped lang="scss">
@import '@/assets/sass/variables.scss';

.separator {
  background-color: $color-base-c2c-lighter;
}
.star-icon {
  color: $yellow;
}
.winner-image {
  height: 250px;
}

.cards-container {
  flex-flow: wrap row;
  justify-content: space-between;

  .card-image {
    transition: 0.2s;
    margin-bottom: 5px;

    img {
      height: 200px;
    }
  }
}
</style>
