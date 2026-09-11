// Vite cannot resolve a webpack-style `require('.../flags/' + country + '.svg')` at build time.
// Eagerly glob all flag assets once and look them up by filename instead.
const flags = import.meta.glob('../assets/img/flags/*.svg', { eager: true, import: 'default' });

export function flagUrl(country) {
  return flags[`../assets/img/flags/${country}.svg`];
}
