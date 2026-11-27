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

<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps({
  inverted: {
    type: Boolean,
    default: false,
  },
  open: {
    type: Boolean,
    default: false,
  },
});

const localOpen = ref(props.open);

function switchOpen() {
  localOpen.value = !localOpen.value;
}
</script>

<style scoped>
.dropdown-content {
  border: 1px solid var(--c2c-grey-lighter);
  padding: 0;
  box-shadow: none;

  &:hover {
    border-color: var(--c2c-grey-light);
  }
}
.dropdown-content-title {
  display: flex;
  align-items: center;
  color: var(--c2c-grey-darker);
  cursor: pointer;
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
}
.is-open {
  font-weight: bold;
  border-radius: 4px 4px 0 0;
}
.dropdown-content-title:hover {
  background: var(--c2c-grey-lightest);
}
.dropdown-content-arrow {
  color: var(--c2c-primary);
  margin-left: auto;
}

.dropdown-content-inverted {
  background: var(--c2c-primary);
  border: 1px solid rgba(0, 0, 0, 0.25);

  &:hover {
    border-color: rgba(0, 0, 0, 0.5);
  }

  .dropdown-content-title {
    color: var(--c2c-white);
  }
  .dropdown-content-title:hover {
    background: var(--c2c-primary);
  }
  .dropdown-content-arrow {
    color: var(--c2c-white);
  }
  .dropdown-content-content {
    color: var(--c2c-white);
  }
}
</style>
