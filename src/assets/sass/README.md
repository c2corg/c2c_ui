CSS global files

- `main.scss`: Bulma (`bulma/`, Bulma 0.9.4 migrated to Sass modules: see its README)
- `variables.scss`: Sass module without CSS output, the variables of Bulma and of the site; `../css/tokens.css` and
  `../css/media.css` give their values to the components, as custom properties and custom media queries

The other global styles are plain CSS, in `../css` (`src/main.ts` imports them around `main.scss`). The `<style>`
blocks of the components are plain CSS too, built by Lightning CSS: no Sass.

`src/styles.spec.ts` compiles all of them, and fails on any Sass warning.
