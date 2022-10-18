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
    <input-checkbox v-model="isChecked" class="checkbox"> Ignorer l'année </input-checkbox>
  </div>
</template>

<script>
export default {
  data() {
    return {
      value: [null, null],
      isChecked: true,
    };
  },

  watch: {
    value: 'updateUrl',
  },

  created() {
    if (!this.$route.query.date) return;

    this.value = this.$route.query.date.split(',');
  },

  methods: {
    updateUrl() {
      const value = [this.value[0], this.value[1]].filter(Boolean).join(',');

      if (value !== this.$route.query.date) {
        this.$router.push({
          query: {
            ...this.$route.query,
            date: value || undefined,
          },
        });
      }
    },
  },
};
</script>
<style scoped lang="scss">
.checkbox {
  margin-top: 10px;
}
</style>
