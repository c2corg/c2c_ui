<template>
  <modal-window ref="modalWindow">
    <div slot="header" class="has-text-centered">
      <fa-icon icon="user-shield"></fa-icon>
      <span v-translate>Paramétrage des cookies</span>
    </div>

    <div class="columns">
      <div class="column">
        <h2 class="is-size-3">Cookies nécessaires</h2>
        <p>
          Les cookies nécessaires sont indispensables au bon fonctionnement de notre site Web et ne peuvent pas être
          désactivés. Ils sont envoyés à votre ordinateur ou à votre appareil lorsque vous demandez une action ou un
          service spécifiques, par exemple lorsque vous vous connectez, remplissez un formulaire ou définissez vos
          préférences en matière de cookies. Si vous configurez votre navigateur de façon à bloquer ces cookies ou à
          vous avertir de l'existence de ces derniers, notre site Web ne fonctionnera pas intégralement.
        </p>
      </div>
      <div class="column">
        <div class="is-flex is-justify-content-space-between is-align-items-baseline">
          <h2 class="is-size-3">Cookies statistiques</h2>
          <div class="field">
            <input
              type="checkbox"
              id="statistics"
              name="statistics"
              class="switch is-rounded"
              v-model="gdpr.statistics"
            />
            <label for="statistics"></label>
          </div>
        </div>
        <p>
          Grâce aux cookies statistiques ou analytiques, fournis par nous et d'autres sociétés, nous pouvons compter les
          visites sur notre site Web et connaître les sources de trafic. Les données que nous obtenons nous aident à
          comprendre ce que les visiteurs aiment et améliorer le site Web. Si vous ne les acceptez pas, nous ne pourrons
          pas améliorer votre expérience.
        </p>
        <div class="is-flex is-justify-content-space-between is-align-items-baseline">
          <h2 class="is-size-3">Cookies sociaux</h2>
          <div class="field">
            <input type="checkbox" id="social" name="social" class="switch is-rounded" v-model="gdpr.social" />
            <label for="social"></label>
          </div>
        </div>
        <p>
          Grâce aux cookies statistiques ou analytiques, fournis par nous et d'autres sociétés, nous pouvons compter les
          visites sur notre site Web et connaître les sources de trafic. Les données que nous obtenons nous aident à
          comprendre ce que les visiteurs aiment et améliorer le site Web. Si vous ne les acceptez pas, nous ne pourrons
          pas améliorer votre expérience.
        </p>
      </div>
    </div>

    <div slot="footer" class="buttons is-flex is-justify-content-flex-end">
      <button class="button" @click="hide">cancel</button>
      <button class="button is-primary" @click="submit">submit</button>
    </div>
  </modal-window>
</template>

<script>
export default {
  data() {
    return {
      gdpr: {
        statistics: false,
        social: false,
      },
    };
  },

  methods: {
    show() {
      this.gdpr = JSON.parse(JSON.stringify(this.$gdpr.get())) || { statistics: false, social: false };
      this.$refs.modalWindow.show();
    },

    hide() {
      this.$refs.modalWindow.hide();
    },

    submit() {
      this.$gdpr.set(this.gdpr);
      this.hide();
    },
  },
};
</script>
