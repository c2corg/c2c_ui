<template>
  <div class="dropdown-content">
    <div>
      <h3 class="dropdown-content-title" :class="{ 'is-open': opened }" @click="switchOpen">
        <slot />
        <fa-icon
          class="dropdown-content-arrow is-size-6 is-pulled-right has-cursor-pointer no-print"
          icon="angle-down"
          :rotation="opened ? 180 : undefined"
        />
      </h3>
    </div>
    <div v-if="opened" class="p-3">
      <slot name="content" />
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      opened: false,
    };
  },
  methods: {
    switchOpen() {
      this.opened = !this.opened;
    },
  },
};
</script>

<style scoped lang="scss">
@import '@/assets/sass/variables.scss';

.dropdown-content {
  border: 1px solid #dbdbdb;
  padding: 0;
  box-shadow: none;

  &:hover {
    border-color: #b5b5b5;
  }
}
.dropdown-content-title {
  cursor: pointer;
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
}
.is-open {
  font-weight: bold;
  border-radius: 4px 4px 0 0;
}
.dropdown-content-title:hover {
  background: $grey-lightest;
}
.dropdown-content-arrow {
  color: $primary;
  margin-top: 0.25rem;
}
</style>
