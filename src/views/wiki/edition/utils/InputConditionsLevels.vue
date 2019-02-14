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
        <td><input type="text" class="input" v-model="level.level_place"></td>
        <td><input type="text" class="input" v-model="level.level_snow_height_soft"></td>
        <td><input type="text" class="input" v-model="level.level_snow_height_total"></td>
        <td><input type="text" class="input" v-model="level.level_comment"></td>
        <td><delete-button class="is-size-2 delete-button" @click="levels.splice(i, 1)"/></td>
      </tr>

      <tr>
        <td><input type="text" class="input" v-model="newLevel.level_place"></td>
        <td><input type="text" class="input" v-model="newLevel.level_snow_height_soft"></td>
        <td><input type="text" class="input" v-model="newLevel.level_snow_height_total"></td>
        <td><input type="text" class="input" v-model="newLevel.level_comment"></td>
        <td><fa-icon icon="plus-circle" class="is-size-2 add-button has-text-success" @click="addLevel"/></td>
      </tr>
    </table>
  </div>
</template>

<script>
  export default {
    props: {
      value: {
        type: String,
        default: null
      }
    },

    data() {
      return {
        levels: [],
        newLevel: {}

      };
    },

    watch: {
      'levels': {
        handler: 'change',
        deep: true
      }
    },

    created() {
      const levels = this.value ? JSON.parse(this.value) : [];

      for (const level of levels) {
        if (level.level_place || level.level_place || level.level_place || level.level_place) {
          this.levels.push(level);
        }
      }
    },

    methods: {
      change() {
        this.$emit('input', JSON.stringify(this.levels));
      },

      addLevel() {
        this.levels.push(this.newLevel);
        this.newLevel = {};
      }
    }
  };
</script>

<style scoped>
    .delete-button{
    }
</style>
