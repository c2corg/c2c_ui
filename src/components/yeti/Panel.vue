<template>
  <div
    class="yeti-panel"
    role="tabpanel"
    :id="'panel' + index"
    :aria-labelledby="'tab' + index"
    :hidden="activeTab !== index"
  >
    <slot></slot>
  </div>
</template>

<script>
import Yetix from '@/components/yeti/Yetix';

export default {
  props: {
    index: {
      type: Number,
      required: true,
    },
  },
  computed: {
    activeTab() {
      return Yetix.activeTab;
    },
  },
};
</script>

<style scoped lang="scss">
@import '@/assets/sass/variables';

.yeti-panel {
  position: relative;
}

:deep(a) {
  &:hover,
  &:focus {
    text-decoration: underline;
  }
}

:deep(h4) {
  margin-top: 1rem;
  margin-bottom: 0.25rem !important;
}

:deep(abbr) {
  text-decoration: none;
  border-bottom: dotted 2px #aaa;
}

:deep(strong),
:deep(dt) {
  font-weight: bold;
  color: inherit;
}

:deep(.yeti-subpanel + .yeti-subpanel) {
  margin-top: 2rem;
}

:deep(.content-ul) {
  list-style: disc outside;
  margin-left: 2em;
}
</style>
