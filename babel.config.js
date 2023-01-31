module.exports = {
  presets: [['@vue/cli-plugin-babel/preset', { targets: { esmodules: true }, polyfills: [] }]],
  /*
   * Looks like since we updated browserslist + caniuse database to support only recent browsers, we need to manually
   * include plugins.
   * See https://github.com/vuejs/vue-loader/issues/1697#issuecomment-780455307
   */
  plugins: ['@babel/plugin-proposal-nullish-coalescing-operator', '@babel/plugin-proposal-optional-chaining'],
};
