export default function install(Vue) {
  const gdprVm = new Vue({
    name: 'Gdpr',

    data() {
      return { gdprValue: undefined };
    },

    created() {
      try {
        let storedValue = this.$localStorage.get('choice');
        // if choice is over a year, consent must be asked again
        if (Date.now() - (storedValue?.date ?? 0) > 1000 * 60 * 60 * 24 * 365) {
          this.$localStorage.clear();
          storedValue = null;
        }
        this.gdprValue = storedValue;
      } catch (err) {
        this.gdprValue = undefined;
      }
    },

    methods: {
      get() {
        return this.gdprValue;
      },

      set(newValue) {
        if (newValue) {
          this.gdprValue = { ...newValue, date: Date.now() };
          this.$localStorage.set('choice', this.gdprValue);
        } else {
          this.gdprValue = undefined;
        }

        if (newValue?.statistics) {
          this.$ga.enable();
        } else {
          this.$ga.disable();
        }
      },

      setAll(accept) {
        this.set(
          accept ? { statistics: true, social: true, ad: true } : { statistics: false, social: false, ad: false }
        );
      },
    },
  });

  Vue.prototype.$gdpr = gdprVm;
}
