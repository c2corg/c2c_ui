<template>
  <modal-window ref="modalWindow">
    <div slot="header" class="has-text-centered">
      <fa-icon icon="user-shield"></fa-icon>
      <span v-translate>Configure cookies</span>
    </div>

    <div class="columns">
      <div class="column">
        <div class="is-flex is-justify-content-space-between is-align-items-baseline">
          <h2 class="is-size-3" v-translate>Necessary cookies</h2>
          <div class="field">
            <input
              type="checkbox"
              id="necessary"
              name="necessary"
              class="switch is-rounded"
              checked="checked"
              disabled
            />
            <label for="necessary"></label>
          </div>
        </div>
        <p v-translate>
          Necessary cookies are essential for the proper functioning of our website and cannot be disabled. They are
          sent to your computer or device when you ask for a specific action or service, e.g. when you log in, fill out
          a form or define your cookie preferences. If you configure your computer to block these cookies or to warn you
          of their existence, our website will not function fully.
        </p>
        <div class="is-flex is-justify-content-space-between is-align-items-baseline">
          <h2 class="is-size-3" v-translate>Statistical cookies</h2>
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
        <p v-translate>
          Thanks to the statistical cookies provided by ourselves and other companies, we can evaluate the visit on our
          website and know the sources of traffic. Data we obtain help us understand what visitors like and improve our
          website. If you reject them, we cannot improve your experience.
        </p>
      </div>
      <div class="column">
        <div class="is-flex is-justify-content-space-between is-align-items-baseline">
          <h2 class="is-size-3" v-translate>Advertisement cookies</h2>
          <div class="field">
            <input type="checkbox" id="ad" name="ad" class="switch is-rounded" v-model="gdpr.ad" />
            <label for="ad"></label>
          </div>
        </div>
        <p v-translate>
          These cookies are used to provide you with personalized advertising based on your browsing on the site. They
          track your activities on the site in order to display relevant ads tailored to your interests. By disabling
          these cookies, you will continue to see ads, but they will no longer be tailored to your preferences.
        </p>
        <div class="is-flex is-justify-content-space-between is-align-items-baseline">
          <h2 class="is-size-3" v-translate>Social cookies</h2>
          <div class="field">
            <input type="checkbox" id="social" name="social" class="switch is-rounded" v-model="gdpr.social" />
            <label for="social"></label>
          </div>
        </div>
        <p v-translate>
          These cookies allow you to interact from camptocamp.org website with social media modules and share content of
          the website with other people or let them know of your consultation or opinion on it, e.g. when you click on
          the "Share" module. By disabling these cookies, you won't be able to share content from camptocamp.org on
          social networks.
        </p>
      </div>
    </div>

    <div slot="footer" class="buttons is-flex is-justify-content-flex-end">
      <button class="button" @click="hide" v-translate>Cancel</button>
      <button class="button is-primary" @click="submit" v-translate>Submit</button>
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
