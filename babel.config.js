module.exports = {
  presets: [
    ['@vue/app', {
      polyfills: [
        'es6.promise',
        'es6.symbol',
        'es6.array.from',
        'es6.object.assign',
        'es7.object.values'
      ]
    }]
  ]
};
