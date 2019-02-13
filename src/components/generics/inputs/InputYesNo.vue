<template>
  <div class="control">

    <input
      :id="'c2c-' + _uid + '_yes'"
      type="radio"
      :value="true"
      class="is-checkradio is-info"
      v-model="value_">
    <label :for="'c2c-' + _uid + '_yes'">{{ $gettext('yes') | uppercaseFirstLetter }}</label>

    <input
      :id="'c2c-' + _uid + '_no'"
      type="radio"
      :value="false"
      class="is-checkradio is-info"
      v-model="value_">
    <label :for="'c2c-' + _uid + '_no'">{{ $gettext('no') | uppercaseFirstLetter }}</label>

  </div>
</template>

<script>
  import { baseMixin } from './mixins.js';

  export default {
    mixins: [ baseMixin ],

    props: {
      value: {
        type: Boolean,
        default: null
      }
    }
  };

</script>

<style scoped>
    .control{ /* extension radio has removed padding around inputs */
        padding-top:calc(0.375em - 1px);
        padding-bottom:calc(0.375em - 1px);
    }
</style>
