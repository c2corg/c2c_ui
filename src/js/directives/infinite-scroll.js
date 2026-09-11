// Replaces the Vue2-only `vue-infinite-scroll` package.
// Usage: v-infinite-scroll="{ load, disabled: someBoolean, distance: 100 }"
// `load` is called whenever a sentinel placed right after the bound element enters the
// viewport (or comes within `distance` px of it), unless `disabled` is true.
export default {
  mounted(el, binding) {
    const sentinel = document.createElement('div');
    sentinel.style.height = '1px';
    el.insertAdjacentElement('afterend', sentinel);

    el._infiniteScrollSentinel = sentinel;
    el._infiniteScrollBinding = binding.value;

    el._infiniteScrollObserver = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !el._infiniteScrollBinding?.disabled) {
          el._infiniteScrollBinding.load();
        }
      },
      { rootMargin: `0px 0px ${binding.value?.distance ?? 0}px 0px` }
    );

    el._infiniteScrollObserver.observe(sentinel);
  },

  updated(el, binding) {
    el._infiniteScrollBinding = binding.value;
  },

  unmounted(el) {
    el._infiniteScrollObserver?.disconnect();
    el._infiniteScrollSentinel?.remove();
  },
};
