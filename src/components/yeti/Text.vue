<template>
  <div class="yeti-text">
    <component :is="component" />
  </div>
</template>

<script>
import Disclaimer from '@/components/yeti/Disclaimer';
import Faq from '@/components/yeti/Faq';

export default {
  components: { Faq, Disclaimer },
  props: {
    component: {
      type: String,
      required: true,
    },
  },
};
</script>

<style>
.yeti-text {
  max-width: 1039px;
}
</style>
