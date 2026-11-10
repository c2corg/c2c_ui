# The CSS of the site

Plain CSS, built by [Lightning CSS](https://lightningcss.dev) (`css.transformer` in `vite.config.ts`): no Sass, no CSS
framework. The class names are Bulma's (`.button`, `.columns`, `.is-primary`...): the CSS behind them is ours
(c2corg/c2c_ui#4907).

## Files

The global CSS, imported by `src/main.ts` in this order:

| File                 | What                                                                                      |
| -------------------- | ----------------------------------------------------------------------------------------- |
| `tokens.css`         | The design tokens: colors, font sizes, radius, shadows, layout sizes (`--c2c-*`)          |
| `scrollbar.css`      | The scrollbars                                                                            |
| `external-links.css` | The icon after the links to other sites                                                   |
| `bulma/`             | The classes from Bulma 0.9.4 (see `bulma/README.md`), with `bulma/palette.css` for colors |
| `checkradio.css`     | Checkboxes and radios `<input class="is-checkradio">`                                     |
| `switch.css`         | Switches `<input type="checkbox" class="switch">`                                         |
| `helpers.css`        | The helper classes of the site (`.is-nowrap`, `.is-ellipsed`, print helpers...)           |
| `fontawesome.css`    | Font Awesome's classes                                                                    |

`media.css` has the breakpoints only: it writes no CSS.

The style of a component is in its `.vue` file, `<style scoped>` most of the time.

## Writing a style

- **Tokens, not values**: `color: var(--c2c-primary)`, `font-size: var(--c2c-size-7)`, `border-radius:
var(--c2c-radius)`. A color or a size used in several places becomes a token in `tokens.css`.
- **Breakpoints**: the custom media of `media.css`, never a width. The style imports `media.css` first.

  ```css
  @import '@/assets/css/media.css';

  @media screen and (--c2c-min-tablet) {
    ...
  }
  ```

  - `--c2c-min-tablet`, `-desktop`, `-widescreen`, `-fullhd`: from the breakpoint on (769px, 1024px, 1216px, 1408px).
  - `--c2c-max-tablet`, `-desktop`, `-widescreen`, `-fullhd`: up to the breakpoint, included.
  - `--c2c-mobile` (up to 768px) and `--c2c-touch` (up to 1023px): Bulma's, below the tablet and desktop breakpoints.

- **Nesting**: native CSS nesting, lowered by Lightning CSS for the browsers that lack it. `&` is needed for a class or
  a pseudo-class on the same element (`&.is-active`, `&:hover`). `&-suffix` (Sass) does not exist: write the full
  class name. Nesting under a selector list (`.a, .b { .c {} }`) gives `:is(.a, .b) .c`, whose specificity is that of
  the most specific selector of the list.
- **Variants by custom properties**: a variant sets custom properties, one rule uses them. See `bulma/palette.css`
  (`--palette`... for `.is-primary`...), `checkradio.css` (`--checkradio-size`).
- **Scoped styles**: `:deep(.child)` for the elements of a child component, `:slotted(.x)` for the content of a slot.
  A scoped style imports only `media.css`: Vue would scope the rules of any other imported file, which would then not
  match the elements a library creates.
- **No `//` comments**: they are not CSS.

## Browsers

The browsers are those of `.browserslistrc` (c2corg/c2c_ui#4880, reviewed in c2corg/c2c_ui#4923): Lightning CSS
adds the prefixes and lowers what they lack (nesting, custom media, `color-mix()` of static colors). It cannot lower:

- `color-mix()` with `var()`: not before Safari 16.2 and Chrome 111 (c2corg/c2c_ui#4963);
- container queries (iOS 16), `:has()` (Firefox 121), `popover` (Firefox 125).

## Classes

Bulma's class names, as in [Bulma 0.9.4's documentation](https://versions.bulma.io/0.9.4/documentation/), which still
describes what they do. Only those the site uses exist (`bulma/README.md`).

- **Layout**: `.columns` / `.column` (`.is-4`, `.is-half`, `.is-narrow`, `.is-multiline`, `.is-mobile`...),
  `.container`, `.section`, `.level`, `.media`.
- **Elements**: `.box`, `.button` (`.buttons` for a group), `.content`, `.delete`, `.icon`, `.image`,
  `.notification`, `.progress`, `.table`, `.tag` (`.tags`), `.title` / `.subtitle`.
- **Forms**: `.field`, `.control`, `.input`, `.textarea`, `.select`, `.file`, `.help`, `.label`, and ours:
  `.is-checkradio`, `.switch`.
- **Components**: `.card`, `.dropdown`, `.modal`, `.tabs`.
- **Modifiers**: colors `.is-white`, `.is-light`, `.is-dark`, `.is-primary`, `.is-link`, `.is-info`, `.is-success`,
  `.is-warning`, `.is-danger`, and `.is-light` with a color for its light variant; sizes `.is-small`, `.is-medium`,
  `.is-large`; states `.is-active`, `.is-loading`.
- **Helpers**: text `.has-text-centered`, `.has-text-primary`, `.has-text-weight-bold`, `.is-size-1` to `.is-size-7`,
  `.is-italic`; visibility `.is-hidden-mobile`, `.is-hidden-tablet`...; flex `.is-flex`...; spacing `.mt-1`...; and
  those of `helpers.css`.

A class of Bulma the site does not use yet (`.is-outlined`, `.mt-6`...) does not exist: write its rules in the module
of `bulma/`.

## Checks

- `npm run lint:style`: stylelint (`.stylelintrc.json`).
- `src/styles.spec.ts` (`npm test`) fails when:
  - a style does not compile with Lightning CSS, or warns;
  - it uses a token or a breakpoint that does not exist;
  - it uses Sass;
  - a scoped style imports another file than `media.css`;
  - the global CSS has a class the code does not use.
