<template>
  <div class="content">
    <table>
      <tr>
        <th v-translate>Location / elevation / orientation</th>
        <th v-translate>soft snow</th>
        <th v-translate>total snow</th>
        <th v-translate>comment</th>
        <th />
      </tr>
      <tr v-for="(level, i) of levels" :key="i">
        <td><input type="text" class="input" v-model.lazy="level.level_place" /></td>
        <td><input type="text" class="input" v-model.lazy="level.level_snow_height_soft" /></td>
        <td><input type="text" class="input" v-model.lazy="level.level_snow_height_total" /></td>
        <td><input type="text" class="input" v-model.lazy="level.level_comment" /></td>
        <td>
          <delete-button
            class="is-size-2 delete-button"
            v-if="i < levels.length - 1 || isLevelFilled(levels[i])"
            @click="levels.splice(i, 1)"
          />
        </td>
      </tr>
    </table>
  </div>
</template>

<script>
export default {
  props: {
    value: {
      type: String,
      default: null,
    },
  },

  data() {
    return {
      levels: [],
    };
  },

  watch: {
    levels: {
      handler: 'change',
      deep: true,
    },
  },

  created() {
    const levels = this.value ? JSON.parse(this.value) : [];

    for (const level of levels) {
      if (this.isLevelFilled(level)) {
        this.levels.push(level);
      }
    }
    this.levels.push({}); // always add empty level in the end
  },

  methods: {
    change() {
      if (this.isLevelFilled(this.levels[this.levels.length - 1])) {
        this.levels.push({});
      }
      this.$emit('input', JSON.stringify(this.levels.filter((level) => this.isLevelFilled(level))));
    },

    isLevelFilled(level) {
      return (
        Boolean(level.level_place) ||
        Boolean(level.level_snow_height_soft) ||
        Boolean(level.level_snow_height_total) ||
        Boolean(level.level_comment)
      );
    },
  },
};
</script>
