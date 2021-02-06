export default function install(Vue) {
  const gdprVm = new Vue({
    name: 'Gdpr',

    data() {
      return { gdprValue: undefined };
    },

    created() {
      try {
        this.set(this.$localStorage.get('choice'));
      } catch (err) {
        this.gdprValue = undefined;
      }
    },

    methods: {
      get() {
        return this.gdprValue;
      },

      set(newValue) {
        this.gdprValue = newValue;
        !!newValue && this.$localStorage.set('choice', newValue);

        if (newValue?.statistics) {
          this.$ga.enable();
        } else {
          this.$ga.disable();
        }
      },
    },
  });

  Vue.prototype.$gdpr = gdprVm;
}
