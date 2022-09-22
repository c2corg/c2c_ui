<template>
  <div v-if="hasData" class="content">
    <table>
      <thead>
        <tr>
          <th v-translate>Location / elevation / orientation</th>
          <th v-translate>soft snow</th>
          <th v-translate>total snow</th>
          <th v-translate>comment</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(level, i) of levels" :key="i">
          <td :data-title="level.level_place ? $gettext('Location / elevation / orientation') : undefined">
            {{ level.level_place }}
          </td>
          <td :data-title="level.level_snow_height_soft ? $gettext('soft snow') : undefined">
            {{ level.level_snow_height_soft }}
          </td>
          <td :data-title="level.level_snow_height_total ? $gettext('total snow') : undefined">
            {{ level.level_snow_height_total }}
          </td>
          <td :data-title="level.level_comment ? $gettext('comment') : undefined">{{ level.level_comment }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
export default {
  props: {
    data: {
      type: String,
      default: null,
    },
  },

  computed: {
    levels() {
      return this.data ? JSON.parse(this.data) : null;
    },
    hasData() {
      if (this.levels === null || this.levels.length === 0) {
        return false;
      }

      const firstLevel = this.levels[0]; // goddamn API...

      return (
        Boolean(firstLevel.level_place) ||
        Boolean(firstLevel.level_snow_height_soft) ||
        Boolean(firstLevel.level_snow_height_total) ||
        Boolean(firstLevel.level_comment)
      );
    },
  },
};
</script>

<style lang="scss" scoped>
@media screen and (max-width: $tablet) {
  thead {
    display: none;
  }

  tr {
    border-top: 1px solid #ddd;

    &:nth-of-type(odd) {
      background-color: #f9f9f9;
    }
  }

  td {
    display: block;
    padding: 0;
    padding-left: 10px;
    text-align: left;
    white-space: normal;
    border: 0 !important;
  }

  // hide cell with no data
  td:not([data-title]) {
    display: none;
  }

  td[data-title]::before {
    content: attr(data-title);
    display: block;
    color: #8d8d8d;
    padding: 0px 10px;
    margin-left: -10px;
    font-variant: small-caps;
    font-weight: 700;
    box-sizing: border-box;
  }
}
</style>
