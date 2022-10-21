<template>
  <div>
    <div class="control">
      <label class="label">{{ $gettext('date_start') | uppercaseFirstLetter }}</label>
      <input class="input" type="date" v-model="value[0]" />
    </div>
    <div class="control">
      <label class="label">{{ $gettext('date_end') | uppercaseFirstLetter }}</label>
      <input class="input" type="date" v-model="value[1]" />
    </div>
    <input-checkbox v-model="usePeriodFilter" class="checkbox">{{ $gettext('Ignore year') }}</input-checkbox>
  </div>
</template>

<script>
export default {
  data() {
    return {
      value: [null, null],
      usePeriodFilter: false,
    };
  },

  computed: {
    currentQueryKey() {
      return this.usePeriodFilter ? 'period' : 'date';
    },
  },

  watch: {
    value: 'updateDateInUrl',
    usePeriodFilter: 'switchFilterInUrl',
  },

  created() {
    const dateQueryString = this.$route.query.date;
    const periodQueryString = this.$route.query.period;

    if (!dateQueryString && !periodQueryString) return;

    if (!periodQueryString) {
      this.value = dateQueryString.split(',');
      return;
    }

    this.value = periodQueryString.split(',');
    this.usePeriodFilter = true;
  },

  methods: {
    updateDateInUrl() {
      const value = [this.value[0], this.value[1]].filter(Boolean).join(',');

      if (value !== this.$route.query[this.currentQueryKey]) {
        this.pushQueryObjectToUrl({ [this.currentQueryKey]: value || undefined });
      }
    },
    switchFilterInUrl() {
      const oldQueryKey = this.usePeriodFilter ? 'date' : 'period';
      const existingQueryString = this.$route.query[oldQueryKey];

      if (!existingQueryString) return;

      this.pushQueryObjectToUrl({
        [oldQueryKey]: undefined,
        [this.currentQueryKey]: existingQueryString,
      });
    },
    pushQueryObjectToUrl(queryObject) {
      this.$router.push({
        query: {
          ...this.$route.query,
          ...queryObject,
        },
      });
    },
  },
};
</script>
<style scoped lang="scss">
.checkbox {
  margin-top: 10px;
}
</style>
