<template>
  <div class="dropdown-content" :class="{ 'dropdown-content-inverted': inverted }">
    <div>
      <h3 class="dropdown-content-title" :class="{ 'is-open': localOpen }" @click="switchOpen">
        <slot />
        <fa-icon
          class="dropdown-content-arrow is-size-6 is-pulled-right has-cursor-pointer no-print"
          icon="angle-down"
          :rotation="localOpen ? 180 : undefined"
        />
      </h3>
    </div>
    <div v-if="localOpen" class="dropdown-content-content p-3">
      <slot name="content" />
    </div>
  </div>
</template>

<script>
export default {
  props: {
    inverted: {
      type: Boolean,
      default: false,
    },
    open: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      localOpen: this.open,
    };
  },
  methods: {
    switchOpen() {
      this.localOpen = !this.localOpen;
    },
  },
};
</script>

<style scoped lang="scss">
@import '@/assets/sass/variables';

.dropdown-content {
  border: 1px solid #dbdbdb;
  padding: 0;
  box-shadow: none;

  &:hover {
    border-color: #b5b5b5;
  }
}
.dropdown-content-title {
  display: flex;
  align-items: center;
  color: $grey-darker;
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
  margin-left: auto;
}

.dropdown-content-inverted {
  background: $primary;
  border: 1px solid rgba(0, 0, 0, 0.25);

  &:hover {
    border-color: rgba(0, 0, 0, 0.5);
  }

  .dropdown-content-title {
    color: $white;
  }
  .dropdown-content-title:hover {
    background: $primary;
  }
  .dropdown-content-arrow {
    color: $white;
  }
  .dropdown-content-content {
    color: $white;
  }
}
</style>
