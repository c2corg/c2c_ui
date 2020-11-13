<template>
  <div>
    <div class="control">
      <label class="label">{{ $gettext('date_start') | uppercaseFirstLetter }}</label>
      <input class="input" type="date" v-model="value" />
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      value: null,
    };
  },

  computed: {
    urlValue: {
      get() {
        return this.$route.query.date ?? '';
      },
      set(value) {
        const query = Object.assign({}, this.$route.query);
        query.date = value;

        if (query.date !== this.$route.query.date) {
          this.$router.push({ query });
        }
      },
    },
  },

  watch: {
    value: 'compute',
  },

  created() {
    this.value = this.urlValue;
  },

  methods: {
    compute() {
      this.urlValue = this.value ? this.value : undefined;
    },
  },
};
</script>
