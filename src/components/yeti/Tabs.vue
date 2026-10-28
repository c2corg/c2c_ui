<template>
  <div class="column pb-0 mb-0 tabs is-boxed yetitabs">
    <ul role="tablist">
      <li v-for="(tab, i) in tabs" role="presentation" :key="tab.name" :class="{ 'is-active': activeTab === i }">
        <a
          class="yetitabs-link"
          role="tab"
          :href="'#panel' + i"
          :id="'tab' + i"
          ref="tabLinks"
          :aria-selected="activeTab === i"
          :tabindex="activeTab === i ? 0 : -1"
          :title="tab.title"
          @click.prevent="setActiveTab(i)"
          @keydown="setActiveTabKeyboard($event, i)"
        >
          <fa-icon :icon="tab.icon" />
          <span v-if="tab.name" class="ml-1">{{ tab.name }}</span>
          <span v-else>&ZeroWidthSpace;</span>
          <counter v-if="tab.counter" is-primary :title="tab.counter.title">
            {{ tab.counter.text }}
          </counter>
          <fa-icon
            v-if="tab.problemIcon"
            icon="exclamation-circle"
            class="has-text-danger ml-1"
            :title="tab.problemIcon.title"
          />
        </a>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { computed, useTemplateRef, watch, type PropType } from 'vue';

import Counter from '@/components/yeti/Counter.vue';
import Yetix from '@/components/yeti/Yetix.vue';

type Tab = {
  name?: string;
  title?: string;
  icon: string | string[];
  counter?: { title: string; text: string | number };
  problemIcon?: { title: string };
};

const props = defineProps({
  tabs: {
    type: Array as PropType<Tab[]>,
    required: true,
  },
});

const tabLinks = useTemplateRef<HTMLElement[]>('tabLinks');

const activeTab = computed(() => Yetix.activeTab as number);

// focus active tab
watch(activeTab, (index) => {
  tabLinks.value![index].focus();
});

function setActiveTab(index: number) {
  Yetix.setActiveTab(index);
}

// Set arrow keys: left/right = switch active tabs / down = focus panel
function setActiveTabKeyboard(event: KeyboardEvent, index: number) {
  const dir =
    event.key === 'ArrowLeft'
      ? index - 1
      : event.key === 'ArrowRight'
        ? index + 1
        : event.key === 'ArrowDown'
          ? 'down'
          : null;

  if (dir !== null) {
    event.preventDefault();

    // If the down key is pressed, move focus to the open panel,
    // otherwise switch to the adjacent tab
    if (dir === 'down') {
      document.getElementById('panel' + index)?.focus();
    } else if (props.tabs[dir]) {
      setActiveTab(dir);
    }
  }
}
</script>

<style scoped lang="scss">
.yetitabs {
  margin: 0 0 0 -1px !important;
  overflow: visible;

  &-link {
    font-size: 0.9em;
    padding: 0.25em 1em;
  }

  li,
  a {
    height: 100%;
  }

  a:focus-visible {
    outline: 2px solid currentColor;
    outline-offset: -2px;
  }

  li {
    margin-right: 1px;
  }
}
</style>
