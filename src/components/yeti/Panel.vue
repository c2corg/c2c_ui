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
import { state } from '@/components/yeti/yetix';

export default {
  props: {
    index: {
      type: Number,
      required: true,
    },
  },
  computed: {
    activeTab() {
      return state.activeTab;
    },
  },
};
</script>

<style scoped lang="scss">
@import '@/assets/sass/variables.scss';

::v-deep {
  a:hover,
  a:focus {
    text-decoration: underline;
  }

  h4 {
    margin-top: 1rem;
    margin-bottom: 0.25rem !important;
  }

  abbr {
    text-decoration: none;
    border-bottom: dotted 2px #aaa;
  }

  strong,
  dt {
    font-weight: bold;
    color: $grey-dark;
  }

  .yeti-subpanel + .yeti-subpanel {
    margin-top: 2rem;
  }

  .content-ul {
    list-style: disc outside;
    margin-left: 2em;
  }

  .yetiform-info {
    font-size: 0.8em;
    opacity: 0.75;
  }

  .yetiform-note {
    position: relative;
    font-size: 0.9em;
    padding: 1em;
    padding-left: 4em;
    margin-bottom: 2em;
    background-color: $white-ter;
    border-radius: 2px;
  }

  .yetiform-note::before {
    content: '?';
    position: absolute;
    top: 1em;
    left: 1em;
    color: white;
    font-size: 1.14em;
    font-weight: bold;
    text-align: center;
    height: 1.375em;
    width: 1.375em;
    line-height: 1.4em;
    background-color: rgba(0, 60, 136, 0.5);
    border-radius: 2px;
  }
}
</style>
