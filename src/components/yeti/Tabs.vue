<template>
  <div class="column pb-0 mb-0 tabs is-boxed yetitabs">
    <ul role="tablist">
      <li v-for="(tab, i) in tabs" role="presentation" :key="tab" :class="{ 'is-active': activeTab === i }">
        <a
          class="yetitabs-link"
          role="tab"
          :href="'#panel' + i"
          :id="'tab' + i"
          ref="tab"
          :aria-selected="activeTab === i"
          :tabindex="activeTab === i ? false : -1"
          @click.prevent="setActiveTab(i)"
          @keydown="setActiveTabKeyboard($event, i)"
        >
          {{ tab }} <counter is-primary v-if="i === 1 && hasFeatures">1</counter>
        </a>
      </li>
    </ul>
  </div>
</template>

<script>
import Counter from '@/components/yeti/Counter.vue';
export default {
  components: { Counter },
  props: {
    tabs: {
      type: Array,
      required: true,
    },
    activeTab: {
      type: Number,
      required: true,
    },
    hasFeatures: {
      type: Boolean,
      default: false,
    },
  },
  methods: {
    setActiveTab(index) {
      // focus active tab
      this.$refs.tab[index].focus();
      // then set
      this.$emit('update:activeTab', index);
    },

    setActiveTabKeyboard(event, index) {
      // Set arrow keys: left/right = switch active tabs / down = focus panel
      let dir = event.which === 37 ? index - 1 : event.which === 39 ? index + 1 : event.which === 40 ? 'down' : null;

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
}

.yetitabs-link {
  font-size: 0.9em;
  padding: 0.25em 1em;
}

.yetitabs li,
.yetitabs a {
  height: 100%;
}

.yetitabs li {
  margin-right: 1px;
}
</style>
