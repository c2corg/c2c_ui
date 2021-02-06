<template>
  <div>
    <div class="gdpr-content" :class="{ active: active }">
      <h4 class="title" v-translate>Contrôlez l"utilisation de vos données personnelles</h4>
      <div class="message">
        <span v-translate class="has-text-justified">
          Notre site Web utilise des cookies fournis par nous et par des tiers. Certains cookies sont nécessaires au
          fonctionnement du site Web, tandis que d'autres peuvent être ajustés par vous à tout moment, en particulier
          ceux qui nous permettent de comprendre les performances de notre site Web, vous fournir des fonctionnalités de
          médias sociaux et offrir une meilleure expérience avec du contenu et de la publicité pertinents. Vous pouvez
          les accepter ou les refuser tous ou bien
        </span>
        <a @click="displayGdprModal()" v-translate>paramétrer vos choix</a>
      </div>
      <div class="buttons is-flex is-justify-content-flex-end">
        <button @click="acceptGdpr(false)" class="button is-danger" v-translate>Tout refuser</button>
        <button @click="acceptGdpr(true)" class="button is-primary" v-translate>Tout accepter</button>
      </div>
    </div>
    <gdpr-modal ref="GdprModal"></gdpr-modal>
  </div>
</template>

<script>
import GdprModal from './GdprModal.vue';

export default {
  components: { GdprModal },

  computed: {
    active: {
      get: function () {
        return !this.$gdpr.get();
      },
      set: function () {
        // only trigger change
        return;
      },
    },
  },

  mounted() {
    this.$root.$on('showGDPR', () => this.displayGdprModal());
  },

  methods: {
    displayGdprModal() {
      this.$refs.GdprModal.show(this.gdprValue);
    },

    acceptGdpr(accept) {
      this.$gdpr.set(accept ? { statistics: true } : { statistics: false });
      this.active = false;
    },
  },
};
</script>

<style lang="scss" scoped>
@import '@/assets/sass/variables.scss';

.gdpr-content {
  z-index: 30;
  position: fixed;
  top: 0;
  width: 50%;
  left: calc(25% - 10px);
  padding: 10px;

  margin: 0 auto;
  flex-direction: column;
  display: flex;
  background-color: white;
  box-shadow: none;
  transform: translateY(-100%);
  transition: all 0.25s ease-in-out;

  &.active {
    box-shadow: rgba(0, 0, 0, 0.3) 1px 1px 6px 0;
    transform: translateY(0);
  }
}
</style>
