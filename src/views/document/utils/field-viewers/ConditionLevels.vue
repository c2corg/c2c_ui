<template>
  <div v-if="hasData" class="content">
    <table>
      <tr>
        <th v-translate>Location / elevation / orientation</th>
        <th v-translate>soft snow</th>
        <th v-translate>total snow</th>
        <th v-translate>comment</th>
      </tr>
      <tr v-for="(level, i) of levels" :key="i">
        <td> {{ level.level_place }} </td>
        <td> {{ level.level_snow_height_soft }} </td>
        <td> {{ level.level_snow_height_total }} </td>
        <td> {{ level.level_comment }} </td>
      </tr>
    </table>
  </div>
</template>

<script>
  export default {
    props: {
      data: {
        type: String,
        default: null
      }
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

        return Boolean(firstLevel.level_snow_height_total) ||
          Boolean(firstLevel.level_snow_height_total) ||
          Boolean(firstLevel.level_snow_height_soft) ||
          Boolean(firstLevel.level_comment);
      }
    }
  };
</script>
