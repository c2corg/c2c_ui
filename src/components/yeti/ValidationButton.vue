<template>
  <div class="validation-button">
    <button class="button is-primary" :class="{ 'is-loading': loading }" :disabled="loading" @click="$emit('click')">
      Calculer le risque
    </button>
    <p class="yetiForm-error" v-if="currentError">
      <span>
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
      default: '',
    },
    loading: {
      type: [Promise, Object],
      default: null,
    },
  },
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

.yetiForm-error span::before {
  content: 'i';
  display: inline-block;
  width: 1rem;
  height: 1rem;
  background: rgba(0, 60, 136, 0.5);
  color: #fff;
  border-radius: 50%;
  font-size: 0.71rem;
  font-weight: bold;
  text-align: center;
}
</style>
