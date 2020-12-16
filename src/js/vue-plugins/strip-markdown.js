import utils from '@/js/utils';

// A very basic (a.k.a not bullet-proof) filter to remove markdown content from summary

export default function install(Vue) {
  Vue.filter('stripMarkdown', (value) => utils.stripMarkdown(value));
}
