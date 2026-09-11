// this mixin will prevent pages to be indexed by search engines

import { useHead } from '@unhead/vue';

export default {
  created() {
    useHead({
      meta: [
        {
          name: 'robots',
          content: 'noindex',
          key: 'meta-robots',
        },
      ],
    });
  },
};
