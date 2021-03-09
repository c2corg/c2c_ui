<template>
  <div class="no-print">
    <div class="gdpr-content" :class="{ active: active }">
      <h4 class="title" v-translate>Control the use of your personal data</h4>
      <div class="message">
        <span v-translate class="has-text-justified">
          Our website uses cookies provided by ourselves and third parties. Some cookies are necessary for the website,
          while you can adjust others at any time, in particular those that allow us to understand the performance of
          our website and to offer you social media features. You can accept or reject all, or
        </span>
        <a @click="showGdprModal()" v-translate>configure your choices</a>.
      </div>
      <div class="buttons mt-2 is-flex is-justify-content-flex-end">
        <button @click="acceptGdpr(false)" class="button is-danger" v-translate>Deny all</button>
        <button @click="acceptGdpr(true)" class="button is-primary" v-translate>Allow all</button>
      </div>
    </div>
    <gdpr-modal ref="GdprModal"></gdpr-modal>
  </div>
</template>

<script>
import GdprModal from './GdprModal.vue';

export default {
  components: { GdprModal },

  data() {
    return {
      userHasInteracted: false,
    };
  },

  computed: {
    active: function () {
      return !this.$gdpr.get() && this.userHasInteracted;
    },
  },

  beforeMount() {
    window.addEventListener('scroll', this.firstUserInteraction);
    window.addEventListener('keydown', this.firstUserInteraction);
    window.addEventListener('resize', this.firstUserInteraction);
    window.addEventListener('click', this.firstUserInteraction);
  },

  mounted() {
    this.$root.$on('showGdpr', () => this.showGdprModal());
  },

  methods: {
    showGdprModal() {
      this.$refs.GdprModal.show(this.gdprValue);
    },

    acceptGdpr(accept) {
      this.$gdpr.setAll(accept);
    },

    firstUserInteraction() {
      window.removeEventListener('scroll', this.firstUserInteraction);
      window.removeEventListener('keydown', this.firstUserInteraction);
      window.removeEventListener('resize', this.firstUserInteraction);
      window.removeEventListener('click', this.firstUserInteraction);

      this.userHasInteracted = true;
    },
  },
};
</script>

<style lang="scss" scoped>
.gdpr-content {
  z-index: 30;
  position: fixed;
  top: 0;
  padding: 10px;

  margin: 0 auto;
  flex-direction: column;
  display: flex;
  background-color: white;
  box-shadow: none;
  transform: translateY(-100%);
  transition: transform 0.25s ease-in-out;

  &.active {
    box-shadow: rgba(0, 0, 0, 0.3) 1px 1px 6px 0;
    transform: translateY(0);
  }
}

@media screen and (min-width: $desktop) {
  .gdpr-content {
    width: 50%;
    left: calc(25% - 10px);

    border-bottom-left-radius: 4px;
    border-bottom-right-radius: 4px;
  }
}
</style>
