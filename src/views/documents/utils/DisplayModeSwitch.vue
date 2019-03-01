<template>
  <dropdown-button class="is-right">
    <fa-icon
      slot="button"
      :icon="['fas', 'eye']"
      class="is-size-4 has-cursor-pointer"/>
    <table class="is-size-6">
      <tr
        class="has-hover-background has-cursor-pointer"
        :class="{'has-text-primary has-text-weight-bold': value==='result'}"
        @click="$emit('input', 'result')">
        <td class="has-text-centered">
          <fa-icon :icon="listMode ? 'th-list' : 'th'"/>
        </td>
        <td class="is-nowrap" v-translate>Results only</td>
      </tr>
      <tr
        class="has-hover-background has-cursor-pointer"
        :class="{'has-text-primary has-text-weight-bold': value==='both'}"
        @click="$emit('input', 'both')">
        <td class="is-nowrap">
          <fa-icon :icon="listMode ? 'th-list' : 'th'"/>
          <span>&thinsp;</span>
          <fa-icon icon="map-marked-alt"/>
        </td>
        <td class="is-nowrap" v-translate>Both results and map</td>
      </tr>
      <tr
        class="has-hover-background has-cursor-pointer"
        :class="{'has-text-primary has-text-weight-bold': value==='map'}"
        @click="$emit('input', 'map')">
        <td class="has-text-centered">
          <fa-icon icon="map-marked-alt"/>
        </td>
        <td class="is-nowrap" v-translate>Map only</td>
      </tr>
    </table>
  </dropdown-button>
</template>

<script>
  export default {
    props: {
      value: {
        type: String,
        required: true
      },
      listMode: {
        type: String,
        required: true
      }
    }
  };
</script>

<style lang="scss" scoped>

  td:nth-child(2){
    padding-left:0.5rem;
  }

</style>
