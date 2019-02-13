// CSS trick for this does not work on all browsers...
// use a vue filter to perform This

export default function install(Vue) {
  Vue.filter('uppercaseFirstLetter', function(value) {
    return value.charAt(0).toUpperCase() + value.slice(1);
  });
}
