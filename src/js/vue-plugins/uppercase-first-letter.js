// CSS trick for this does not work on all browsers...
// use a global method to perform this

export function uppercaseFirstLetter(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

// Vue 3 removed filters (`{{ value | uppercaseFirstLetter }}`); register as a global method instead,
// called as `{{ uppercaseFirstLetter(value) }}`.
export default function install(app) {
  app.mixin({
    methods: {
      uppercaseFirstLetter,
    },
  });
}
