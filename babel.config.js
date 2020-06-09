module.exports = {
  presets: [
    [
      '@vue/cli-plugin-babel/preset',
      {
        // see https://cli.vuejs.org/guide/browser-compatibility.html#usebuiltins-usage
        // those are set only for IE11 and can be dropped when abandonned
        polyfills: ['es.promise', 'es.symbol', 'es.array.from', 'es.object.assign', 'es.object.values'],
      },
    ],
  ],
};
