module.exports = {
  presets: [
    [
      '@vue/cli-plugin-babel/preset',
      {
        // see https://cli.vuejs.org/guide/browser-compatibility.html#usebuiltins-usage
        // those are set only for IE11 and can be dropped when abandonned
        polyfills: ['es6.promise', 'es6.symbol', 'es6.array.from', 'es6.object.assign', 'es7.object.values'],
      },
    ],
  ],
};
