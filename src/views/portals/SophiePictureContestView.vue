<template>
  <div class="section">
    <h1 class="title is-1 has-text-centered">
      <router-link :to="{ name: 'article', params: { id: 1204369 } }" v-translate>Sophie Picture Contest</router-link>
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
      <div class="columns is-centered is-multiline">
        <div v-for="winner of winners" :key="winner.documentId" class="column is-4">
          <div class="has-text-centered has-text-weight-bold title is-2">
            <fa-icon icon="star" class="star-icon" />
            {{ $gettext(winner.category) }}
          </div>
          <div class="has-text-centered">
            <document-link :document="{ ...winner.image, ...{ type: 'i' } }">
              <img
                :src="getImageUrl(winner.image)"
                :alt="$documentUtils.getDocumentTitle(winner.image)"
                class="winner-image"
                loading="lazy"
              />
            </document-link>
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

    <div v-if="year">
      <hr class="separator" />

      <h3 class="title is-2 has-text-centered">
        <span v-translate>Candidates</span>
        <span class="is-size-4" v-if="images" @click="sortByAssociationDate = !sortByAssociationDate">
          ({{ images.length }})
          <fa-icon icon="sort-amount-up" v-if="sortByAssociationDate" />
        </span>
      </h3>
      <div class="cards-container is-flex" v-if="images">
        <document-link
          v-for="image in images"
          :key="image.document_id"
          :document="image"
          :title="$documentUtils.getDocumentTitle(image)"
          class="card-image"
        >
          <img :src="getImageUrl(image)" loading="lazy" :alt="$documentUtils.getDocumentTitle(image)" />
        </document-link>
      </div>
      <loading-notification v-else :promise="promise" />
    </div>
  </div>
</template>

<script>
import c2c from '@/js/apis/c2c';
import imageUrls from '@/js/image-urls';

let associations = [];

export default {
  data() {
    return {
      promise: null,
      images: null,
      sortByAssociationDate: false,
    };
  },

  // $gettext('Action', 'Sophie picture context')
  // $gettext('Action - prix du jury', 'Sophie picture context')
  // $gettext('Action - prix du public', 'Sophie picture context')
  // $gettext('Paysage', 'Sophie picture context')
  // $gettext('Paysage - prix du jury et du public', 'Sophie picture context')
  // $gettext('Coup de coeur', 'Sophie picture context')
  // $gettext('Topoguide', 'Sophie picture context')
  // $gettext('Topoguide - prix du jury', 'Sophie picture context')
  // $gettext('Topoguide - prix du public', 'Sophie picture context')
  years: {
    2009: { year: 2009, documentId: 187913, winners: null },
    2010: { year: 2010, documentId: 237549, winners: null },
    2011: { year: 2011, documentId: 300413, winners: null },
    2012: { year: 2012, documentId: 374949, winners: null },
    2013: { year: 2013, documentId: 465897, winners: null },
    2014: { year: 2014, documentId: 555996, winners: null },
    2015: { year: 2015, documentId: 673796, winners: null },
    2016: { year: 2016, documentId: 809627, winners: null },
    2017: {
      year: 2017,
      documentId: 937458,
      winners: [
        {
          title: 'Vivian Bruchez dans le dernier rappel plein gaz de la Dent du Géant au coucher de soleil',
          author: 'Alex Buisse',
          image: { document_id: 939216 },
          category: 'Action',
        },
        {
          title: 'Lever du jour sur la Grande Casse',
          author: 'Jérôme Dauvergne',
          image: { document_id: 939735 },
          category: 'Paysage',
        },
      ],
    },
    2018: {
      year: 2018,
      documentId: 1058594,
      winners: [
        {
          title: 'Flo dans Juvsoyla à Rjukan - Norvège',
          author: 'Valentin Chapuis',
          image: { document_id: 1060425 },
          category: 'Action',
        },
        {
          title: 'Au sommet du Helvetestinden, Lofoten',
          author: 'Alex Buisse',
          image: { document_id: 1060227 },
          category: 'Coup de coeur',
        },
      ],
    },
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
    2020: {
      year: 2020,
      documentId: 1251594,
      winners: [
        {
          title: 'Pic de Bure, vallon Froid',
          author: 'ThierryC',
          image: { document_id: 1253196 },
          category: 'Action - prix du jury',
        },
        {
          title: 'Arpelistock',
          author: 'jvallet',
          image: { document_id: 1253534 },
          category: 'Paysage - prix du jury et du public',
        },
        {
          title: 'Arête de la table de Roc',
          author: 'gula',
          image: { document_id: 1258595 },
          category: 'Topoguide - prix du jury',
        },
        {
          title: 'Tempête sous Roche Château',
          author: 'DominicL',
          image: { document_id: 1257660 },
          category: 'Action - prix du public',
        },
        {
          title: 'Secours au crépuscule au Grépon',
          author: 'Rob.Bonnet',
          image: { document_id: 1257385 },
          category: 'Topoguide - prix du public',
        },
      ],
    },
    2021: {
      year: 2021,
      documentId: 1350370,
      winners: [],
    },
  },

  computed: {
    /*
     * properties that are deducted from URL
     */
    documentId() {
      return this.year ? this.$options.years[this.year].documentId : null;
    },
    winners() {
      return this.year ? this.$options.years[this.year].winners : null;
    },
    year() {
      return this.$route.params.year ? parseInt(this.$route.params.year, 10) : null;
    },
  },

  watch: {
    $route: {
      handler: 'onLoad',
      immediate: true,
    },
    sortByAssociationDate: 'onLoad',
  },

  methods: {
    onLoad() {
      this.images = null;

      if (this.sortByAssociationDate) {
        associations = [];
        this.loadBatch(0);
      } else {
        this.promise = c2c.article
          .get(this.documentId)
          .then((response) => (this.images = response.data.associations.images));
      }
    },

    loadBatch(offset) {
      this.promise = c2c.association
        .getHistory({ documentId: this.documentId, offset })
        .then((response) => this.onLoadBatch(response, offset));
    },

    onLoadBatch(response, offset) {
      associations = associations.concat(response.data.associations);

      if (response.data.associations.length !== 0) {
        this.loadBatch(offset + 50);
      } else {
        let contributions = {};

        associations.reverse().forEach((association) => {
          let image = null;

          if (association.child_document.type === 'i') {
            image = association.child_document;
          } else if (association.parent_document.type === 'i') {
            image = association.parent_document;
          } else {
            return;
          }

          contributions[image.document_id] = {
            image,
            is_creation: association.is_creation,
            user: association.user,
            written_at: association.written_at,
          };
        });

        contributions = Object.values(contributions).filter((contribution) => contribution.is_creation);
        contributions = contributions.sort((a, b) => {
          return a.written_at === b.written_at ? 0 : a.written_at > b.written_at ? 1 : -1;
        });

        this.images = contributions.map((c) => c.image);
      }
    },

    getImageUrl: imageUrls.getMedium,
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
    padding-left: 5px;
    padding-right: 5px;
    min-width: 200px;
    text-align: center !important;

    img {
      height: 200px;
    }
  }
}
</style>
