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
            <document-link :document="{ ...winner.image, type: 'i' }">
              <thumbnail
                :img="winner.image"
                size="MI"
                :alt="
                  $documentUtils.getDocumentTitle({
                    ...winner.image,
                    title: winner.title ?? $gettext('No title'),
                    type: 'i',
                  })
                "
                class="winner-image"
                loading="lazy"
              />
            </document-link>
          </div>
          <div class="has-text-centered">
            <span class="is-italic"> {{ winner.title ?? $gettext('No title') }}, </span>
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
          <thumbnail :img="image" size="MI" loading="lazy" :alt="$documentUtils.getDocumentTitle(image)" />
        </document-link>
      </div>
      <loading-notification v-else :promise="promise" />
    </div>
  </div>
</template>

<script>
import c2c from '@/js/apis/c2c';

let associations = [];

export default {
  data() {
    return {
      promise: null,
      images: null,
      sortByAssociationDate: true,
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
    2009: {
      year: 2009,
      documentId: 187913,
      winners: [
        {
          title: 'Ombres et courbes sous la Pierra Menta (Beaufortain)',
          author: 'Astier.V',
          image: { document_id: 189178 },
          category: 'Prix du Public',
        },
      ],
    },
    2010: {
      year: 2010,
      documentId: 237549,
      winners: [
        {
          title: 'Halo lunaire en Islande',
          author: 'Olivier Bidot',
          image: { document_id: 240490 },
          category: 'Prix de la Meilleure Photo',
        },
        {
          title: "Le Pas de l'Oeille à la dent de Crolles",
          author: 'Martin Gerbaux',
          image: { document_id: 198978 },
          category: 'Prix de la Participation au Topoguide',
        },
        {
          title: 'Piz Roseg',
          author: 'Nico',
          image: { document_id: 241044 },
          category: 'Prix Spécial du Jury',
        },
      ],
    },
    2011: {
      year: 2011,
      documentId: 300413,
      winners: [
        {
          title: "Cervin, Obergabelhorn, Dent d'Hérens",
          author: 'BertrandSemelet',
          image: { document_id: 300594 },
          category: 'Paysage',
        },
        {
          title: 'En haut du Trident',
          author: 'Vp2L',
          image: { document_id: 301481 },
          category: 'Action',
        },
      ],
    },
    2012: {
      year: 2012,
      documentId: 374949,
      winners: [
        {
          title: 'Kandersteg/ Namenlos',
          author: 'altii',
          image: { document_id: 376859 },
          category: 'Action',
        },
        {
          title: 'Oisans, le troupeau se rassemble en fin de journée',
          author: 'clec',
          image: { document_id: 377637 },
          category: 'Paysage',
        },
        {
          title: 'Ambiance brumeuse et gazeuse dans « Etat de Choc »…',
          author: ' Guillaume Pellissier',
          image: { document_id: 379748 },
          category: 'Topoguide',
        },
      ],
    },
    2013: {
      year: 2013,
      documentId: 465897,
      winners: [
        {
          title: 'Lumières naturelles à deux spatules du stratus',
          author: 'Rem',
          image: { document_id: 470596 },
          category: 'Prix du Public',
        },
        {
          title: 'Arrivée au sommet du Gletschhorn (région Furka, Suisse)',
          author: 'florence christe',
          image: { document_id: 466096 },
          category: 'Action',
        },
        {
          title: 'Hauts plateaux',
          author: 'riv018',
          image: { document_id: 466017 },
          category: 'Paysage',
        },
      ],
    },
    2014: {
      year: 2014,
      documentId: 555996,
      winners: [
        {
          title: 'Vallee Blanche',
          author: 'Dorota',
          image: { document_id: 565423 },
          category: 'Prix du Public',
        },
        {
          title: 'Escalade historique dans les Calanques : Le bidule.',
          author: 'Mickaël Souveton',
          image: { document_id: 565791 },
          category: 'Action',
        },
        {
          title: 'Aiguilles de Chamonix',
          author: 'mat robin',
          image: { document_id: 562741 },
          category: 'Paysage',
        },
      ],
    },
    2015: {
      year: 2015,
      documentId: 673796,
      winners: [
        {
          title: 'Jolie ambiance goulotte pour L3 de Répulsion dans le vallon du Diable',
          author: 'JBT',
          image: { document_id: 678170 },
          category: 'Action',
        },
        {
          title: 'Soleil levant sur la Laguna Verde - Licancabur',
          author: 'florian-74',
          image: { document_id: 679321 },
          category: 'Paysage',
        },
        {
          title: 'Rappel dans la face sud',
          author: 'Plov',
          image: { document_id: 571440 },
          category: 'Topoguide',
        },
      ],
    },
    2016: {
      year: 2016,
      documentId: 809627,
      winners: [
        {
          title: 'Indian Creek, Supercrack',
          author: 'velentin_chapuis',
          image: { document_id: 815886 },
          category: 'Action',
        },
        {
          title: 'Le paradis à 2 pas de la maison',
          author: 'PLN',
          image: { document_id: 811590 },
          category: 'Paysage',
        },
        {
          title: 'Extasyée',
          author: 'Flop73',
          image: { document_id: 812177 },
          category: 'Paysage',
        },
      ],
    },
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
      winners: [
        {
          title: "Rappel à la Tour d'Aï",
          author: 'MartinSteffen',
          image: { document_id: 1359740 },
          category: 'Action',
        },
        {
          title: 'Arche galactique sur Ordesa',
          author: 'florian-74',
          image: { document_id: 1362020 },
          category: 'Paysage',
        },
        {
          title: 'Une Chouette de tengmalm à 11h00 du matin… Normal…',
          author: 'LouisB',
          image: { document_id: 1354989 },
          category: 'Faune / Flore / Inclassable',
        },
        {
          title: 'Tafoni Frenzy',
          author: 'Xavier Fauvergue',
          image: { document_id: 1355704 },
          category: 'Topoguide',
        },
        {
          title: 'Que la lumière soit! (dent blanche, 13 sept 2021)',
          author: 'vincent71',
          image: { document_id: 1356886 },
          category: 'Prix du Public',
        },
      ],
    },
    2022: {
      year: 2022,
      documentId: 1463470,
      winners: [
        {
          title: 'Lyskamm - le Mangeur d’Hommes',
          author: 'Apoutsiak',
          image: { document_id: 1467500 },
          category: 'Action',
        },
        {
          author: 'petitefleur',
          image: { document_id: 1476284 },
          category: 'Paysage',
        },
        {
          title: 'Face à face',
          author: 'Blf',
          image: { document_id: 1476650 },
          category: 'Faune / Flore / Inclassable',
        },
        {
          title: 'Levé de soleil au Morgenhorn',
          author: 'Plov',
          image: { document_id: 1438319 },
          category: 'Topoguide',
        },
        {
          title: 'Lumière',
          author: 'Jerome01',
          image: { document_id: 1475788 },
          category: 'Coup de coeur',
        },
        {
          title: 'Peu d’audace à l’Androsace',
          author: 'SEBonhomme_de_neige',
          image: { document_id: 1476379 },
          category: 'Prix du Public',
        },
        {
          title: 'Lyskamm - le Mangeur d’Hommes',
          author: 'Apoutsiak',
          image: { document_id: 1467500 },
          category: 'Prix du Public',
        },
      ],
    },
    2023: {
      year: 2023,
      documentId: 1575347,
      winners: [
        {
          title: "Epée d'Entrèves",
          author: 'Roland-V',
          image: { document_id: 1588823 },
          category: 'Action',
        },
        {
          title: 'Paysage',
          author: 'Thomas Henninger',
          image: { document_id: 1586984 },
          category: 'Paysage',
        },
        {
          title: 'Silhouette',
          author: 'Bruno Le Feuvre',
          image: { document_id: 1588572 },
          category: 'Faune / Flore / Inclassable',
        },
        {
          title: 'Le Chablais, depuis le Jura',
          author: 'Sylvain Chapeland',
          image: { document_id: 1589244 },
          category: 'Topoguide',
        },
        {
          title: "Epée d'Entrèves",
          author: 'Roland-V',
          image: { document_id: 1588823 },
          category: 'Prix du Public',
        },
      ],
    },
    2024: {
      year: 2024,
      documentId: 1590020,
      winners: [
        {
          title: 'La faucheuse des neiges',
          author: 'xlpgn',
          image: { document_id: 1695200 },
          category: 'Action',
        },
        {
          title: 'Toute la voie Lactée dans le Trou de la Mouche',
          author: 'Julien Metais',
          image: { document_id: 1699110 },
          category: 'Paysage',
        },
        {
          title: 'La fuite en avant',
          author: 'Thomas Henninger',
          image: { document_id: 1699394 },
          category: 'Faune / Flore / Inclassable',
        },
        {
          title: 'Rocher de l’Armet fantomatique, notre presque Cervin',
          author: 'Thierry Clavel',
          image: { document_id: 1693933 },
          category: 'Topoguide',
        },
        {
          title: 'ça gaz dans le piller sommital (L26)',
          author: 'Loic Blondeau',
          image: { document_id: 1675966 },
          category: 'Prix du Public',
        },
      ],
    },
    2025: {
      year: 2025,
      documentId: 1809682,
      winners: [
        {
          title: "Rappel de l'Ermite",
          author: 'Emilien Hugon',
          image: { document_id: 1820998 },
          category: 'Action',
        },
        {
          title: 'Lac, mer de nuage, coucher de soleil',
          author: 'Gweilus',
          image: { document_id: 1828515 },
          category: 'Paysage',
        },
        {
          title: 'Entre les ombres',
          author: 'Nizon',
          image: { document_id: 1824474 },
          category: 'Faune / Flore / Inclassable',
        },
        {
          title: 'Ombres Suisses',
          author: 'gilles74',
          image: { document_id: 1703979 },
          category: 'Topoguide',
        },
      ],
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
  },
};
</script>

<style scoped lang="scss">
@import '@/assets/sass/variables';

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
