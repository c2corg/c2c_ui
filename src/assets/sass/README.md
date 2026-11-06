CSS global files

- `main.scss`: the global styles, Bulma included (`bulma/`, Bulma 0.9.4 migrated to Sass modules: see its README)
- `variables.scss`, `mixins.scss`: Sass modules without CSS output, added to every component style by
  `vite.config.ts` (`@use '@/assets/sass/variables' as *;`)
- `checkradio.scss`, `switch.scss`: checkboxes, radios and switches, from bulma-checkradio and bulma-switch

`src/styles.spec.ts` compiles all of them, and every `<style lang="scss">`, and fails on any Sass warning.
