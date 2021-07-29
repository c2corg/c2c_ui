// this mixin will prevent pages to be indexed by search engines

export default {
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
