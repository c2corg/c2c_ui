<template>
  <dropdown-button class="is-right">
    <span slot="button" class="button">
      <fa-icon :icon="['fas', 'eye']" class="is-size-4"/>
      <span>&nbsp;</span>
      <fa-icon icon="angle-down" aria-hidden="true"/>
    </span>
    <a
      class="dropdown-item is-size-6"
      :class="{'is-active': value==='result'}"
      @click="$emit('input', 'result')">
      <span class="has-text-centered item-icons">
        <fa-icon :icon="listMode ? 'th-list' : 'th'"/>
      </span>
      <span class="is-nowrap" v-translate>Results only</span>
    </a>
    <a
      class="dropdown-item is-size-6"
      :class="{'is-active': value==='both'}"
      @click="$emit('input', 'both')">
      <span class="is-nowrap item-icons">
        <fa-icon :icon="listMode ? 'th-list' : 'th'"/>
        <fa-icon icon="map-marked-alt"/>
      </span>
      <span class="is-nowrap" v-translate>Both results and map</span>
    </a>
    <a
      class="dropdown-item is-size-6"
      :class="{'is-active': value==='map'}"
      @click="$emit('input', 'map')">
      <span class="has-text-centered item-icons">
        <fa-icon icon="map-marked-alt"/>
      </span>
      <span class="is-nowrap" v-translate>Map only</span>
    </a>
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
  .item-icons{
    display:inline-block;
    width:2.2rem;

    svg{
      margin:0 0.1rem;
    }
  }

  span:nth-child(2) {
    padding-left: 0.5rem;
  }
</style>
