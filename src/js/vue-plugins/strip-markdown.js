// A very basic (a.k.a not bullet-proof) filter to remove markdown content from summary

export default function install(Vue) {
  Vue.filter('stripMarkdown', function (value) {
    return value
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // external links
      .replace(/\[\[[^|]+\|([^\]]+)\]\]/g, '$1') // internal links
      .replace(/([\\s\n])-(\\s\n)/g, '$1$2') // dash, but only when preceded and followed by a space chare or line return
      .replace(/[*_\\#~`]/g, '') // emphasis and other similar stuff
      .replace(/<su[bp]>(.+)<\/su[bp]>/g, '$1'); // sup
  });
}
