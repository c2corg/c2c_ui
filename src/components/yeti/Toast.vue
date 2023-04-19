<template>
  <div class="yeti-toast">
    <h2 class="title is-6"><slot name="title" /></h2>
    <p><slot /></p>
  </div>
</template>

<script>
import { toast } from 'bulma-toast';

export default {
  methods: {
    toast(props) {
      // merge props
      let opts = {
        ...{
          duration: 3000,
          type: 'is-info',
          pauseOnHover: true,
          position: 'center',
          dismissible: true,
          single: true,
        },
        ...props,
      };
      // add message
      opts.message = this.$el;
      toast(opts);
    },
  },
};
</script>

<style scoped>
.yeti-toast {
  display: none;
  white-space: normal;
}
.notification .yeti-toast {
  display: block;
}
</style>
