// A component of a library written for Vue 3. The app runs with the Vue 2 behaviours of @vue/compat (compatConfig
// MODE 2 in vite.config.mjs), which such components don't expect: v-model as `modelValue` / `update:modelValue` (not
// `value` / `input`), $attrs with class and style... MODE 3 gives them plain Vue 3.
export default function vue3(component) {
  component.compatConfig = { MODE: 3 };
  return component;
}
