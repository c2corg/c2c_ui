CSS global files

- `main.scss`: the global styles, Bulma included (`bulma/`, Bulma 0.9.4 migrated to Sass modules: see its README)
- `variables.scss`: Sass module without CSS output, the variables of Bulma and of the site; `../css/tokens.css` and
  `../css/media.css` give their values to the components, as custom properties and custom media queries
- `checkradio.scss`, `switch.scss`: checkboxes, radios and switches, from bulma-checkradio and bulma-switch

The `<style>` blocks of the components are plain CSS, built by Lightning CSS: no Sass.

`src/styles.spec.ts` compiles all of them, and fails on any Sass warning.
