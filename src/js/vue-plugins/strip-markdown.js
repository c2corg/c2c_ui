// A very basic (a.k.a not bullet-proof) filter to remove markdown content from summary

export default function install(Vue) {
  Vue.filter('stripMarkdown', function(value) {
    return value
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // external links
      .replace(/\[\[[^|]+|([^\]]+)\]\]/g, '$1') // internal links
      .replace(/[*_\-#~`]/g, ''); // emphasis, lists and other similar stuff
  });
}
