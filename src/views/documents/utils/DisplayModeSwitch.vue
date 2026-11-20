<template>
  <div class="buttons has-addons display-mode-switch" role="group" :aria-label="$gettext('Display')">
    <!-- $gettext('Results shown alone') $gettext('Map shown alone') $gettext('Hide results') $gettext('Hide the map') -->
    <!-- $gettext('Show results') $gettext('Show the map') -->
    <button
      v-for="pane of PANES"
      :key="pane.mode"
      type="button"
      class="button is-small"
      :class="{ 'is-shown': shown(pane.mode), 'is-locked': locked(pane.mode) }"
      :aria-pressed="shown(pane.mode)"
      :aria-disabled="locked(pane.mode)"
      :title="$gettext(title(pane.mode))"
      :aria-label="$gettext(title(pane.mode))"
      @click="toggle(pane.mode)"
    >
      <fa-icon :icon="pane.icon" class="is-size-5" />
    </button>
  </div>
</template>

<script setup lang="ts">
// what the list shows: 'result', 'map' or 'both'. Each pane is a toggle; the last one shown cannot be hidden
const props = defineProps({
  modelValue: {
    type: String,
    required: true,
  },
});
const emit = defineEmits(['update:modelValue']);

type Pane = 'result' | 'map';
const PANES: { mode: Pane; icon: string }[] = [
  { mode: 'result', icon: 'table' },
  { mode: 'map', icon: 'map' },
];
const other = (pane: Pane): Pane => (pane === 'result' ? 'map' : 'result');

const shown = (pane: Pane) => props.modelValue === 'both' || props.modelValue === pane;
const locked = (pane: Pane) => props.modelValue === pane;

// the message of the button, translated by the template
function title(pane: Pane) {
  if (locked(pane)) return pane === 'result' ? 'Results shown alone' : 'Map shown alone';
  if (shown(pane)) return pane === 'result' ? 'Hide results' : 'Hide the map';
  return pane === 'result' ? 'Show results' : 'Show the map';
}

function toggle(pane: Pane) {
  if (locked(pane)) return;
  emit('update:modelValue', shown(pane) ? other(pane) : 'both');
}
</script>

<style scoped>
.display-mode-switch {
  flex-wrap: nowrap;
  margin-bottom: 0;

  .button {
    margin-bottom: 0;
    width: 2.6rem;
    height: 2.2rem;
    color: var(--c2c-grey-light);
    transition:
      background-color 0.15s ease,
      color 0.15s ease,
      border-color 0.15s ease;

    /* what a click would show, lighter than what is shown */
    &:hover {
      color: rgba(51, 122, 183, 0.6);
    }

    &.is-shown {
      background-color: var(--c2c-primary-light);
      border-color: var(--c2c-primary);
      /* above its neighbour: its whole border is seen */
      z-index: 1;

      &,
      &:hover {
        color: var(--c2c-primary);
      }
    }

    &.is-locked {
      cursor: default;
    }

    /* no ring after a click, only for the keyboard */
    &:focus:not(:focus-visible) {
      box-shadow: none;

      &:not(.is-shown) {
        border-color: var(--c2c-grey-lighter);
      }
    }

    &:focus-visible {
      z-index: 2;
    }
  }
}
</style>
