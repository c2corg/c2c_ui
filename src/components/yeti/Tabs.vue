<template>
  <div class="column pb-0 mb-0 tabs is-boxed yetitabs">
    <ul role="tablist">
      <li v-for="(tab, i) in tabs" role="presentation" :key="tab.name" :class="{ 'is-active': activeTab === i }">
        <a
          class="yetitabs-link"
          role="tab"
          :href="'#panel' + i"
          :id="'tab' + i"
          ref="tab"
          :aria-selected="activeTab === i"
          :tabindex="activeTab === i ? false : -1"
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

<script>
import Counter from '@/components/yeti/Counter';
import Yetix from '@/components/yeti/Yetix';

export default {
  components: {
    Counter,
  },
  props: {
    tabs: {
      type: Array,
      required: true,
    },
  },
  computed: {
    activeTab() {
      return Yetix.activeTab;
    },
  },
  watch: {
    activeTab(index) {
      // focus active tab
      this.$refs.tab[index].focus();
    },
  },
  methods: {
    setActiveTab(index) {
      Yetix.setActiveTab(index);
    },
    setActiveTabKeyboard(event, index) {
      // Set arrow keys: left/right = switch active tabs / down = focus panel
      const ARROW_LEFT = 37;
      const ARROW_RIGHT = 39;
      const ARROW_DOWN = 40;
      let dir =
        event.which === ARROW_LEFT
          ? index - 1
          : event.which === ARROW_RIGHT
          ? index + 1
          : event.which === ARROW_DOWN
          ? 'down'
          : null;

      if (dir !== null) {
        event.preventDefault();

        // If the down key is pressed, move focus to the open panel,
        // otherwise switch to the adjacent tab
        dir === 'down'
          ? this.$parent.$refs['panel' + index].$el.focus()
          : this.tabs[dir]
          ? this.setActiveTab(dir)
          : void 0;
      }
    },
  },
};
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
    outline: none;
  }

  li {
    margin-right: 1px;
  }
}
</style>
