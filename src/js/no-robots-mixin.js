// this mixin will prevent pages to be indexed by search engines
import headMixin from '@/js/head-mixin';

export default {
  mixins: [headMixin],

  head: {
    meta: [
      {
        name: 'robots',
        content: 'noindex',
        id: 'meta-robots',
      },
    ],
  },
};
