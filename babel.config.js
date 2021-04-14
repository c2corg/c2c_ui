module.exports = {
  presets: ['@vue/cli-plugin-babel/preset'],
  // don't know why we have to include these ES2020 plugins now, should be in babel-preset-env...
  plugins: ['@babel/plugin-proposal-nullish-coalescing-operator', '@babel/plugin-proposal-optional-chaining'],
};
