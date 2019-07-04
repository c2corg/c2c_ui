<template>
  <div class="validation-button">
    <button
      class="button is-primary"
      :class="{'is-loading': loading}"
      :disabled="loading"
      @click="$emit('click')">
      Calculer le risque
    </button>
    <p class="yetiForm-error" v-if="currentError">
      <span>
        <strong>Info: </strong>
        {{ currentError }}
      </span>
    </p>
  </div>
</template>

<script>
  export default {

    props: {
      currentError: {
        type: String,
        default: ''
      },
      loading: {
        type: Promise,
        default: null
      }
    }

  };
</script>

<style scoped>

.yetiForm-error {
  font-size: 0.8em;
  font-style: italic;
  margin-top: 10px;
  text-align: right;
  opacity: 0.75;
}

</style>
