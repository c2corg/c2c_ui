# Bulma 0.9.4, as plain CSS

The parts of [Bulma](https://bulma.io) 0.9.4 (MIT License, see `LICENSE`) the site uses, one file per module of
Bulma's Sass (`elements/button.css` for `sass/elements/button.sass`...), loaded in Bulma's order by `index.css`.
`shared.css` has the rules several modules share (controls, unselectable, block margins, delete, loader),
`palette.css` the colors of the color classes.

This is our code: the plan (c2corg/c2c_ui#4907) is to make it our own CSS, one module at a time (tokens instead of
values, nesting, custom properties instead of variants), keeping the class names (`.button`, `.columns`,
`.is-primary`...).

## Made our own

- `elements/title.css`: nesting, sizes as tokens (`--c2c-size-1`... `--c2c-size-7`).
- `palette.css` (ours): the colors of the color classes (`.is-primary`...) as custom properties (`--palette`...).
- `elements/button.css`, `elements/tag.css`, `elements/notification.css`: nesting, one set of color rules that use
  the palette.
- `elements/progress.css`, `elements/table.css`, `form/file.css`, `form/input-textarea.css`, `form/select.css`,
  `form/tools.css`: one set of color rules that use the palette.
- All the modules: nesting, where the rules that follow a rule start with its selector.

## Where it comes from

The CSS is the output of Bulma's Sass as the site compiled it until c2corg/c2c_ui#4907 removed Sass: the modules
migrated to the Sass module system, configured with the c2c variables (their values are the tokens of
`../tokens.css`), with only the classes the site used (c2corg/c2c_ui#4918, 250 of the 933 classes these modules can
write). The output was split by module with its source map. The CSS of the site did not change.

The history of the Sass is in git: `src/assets/sass/` before c2corg/c2c_ui#4907.

Where the Sass source of a declaration used a variable that is a token (`color: $text`, `$box-color: $text`, the
colors of the `@each` loops: `.is-primary`...), the CSS uses the token: `var(--c2c-text)`. The other values are those
Sass computed (`bulmaDarken($primary, 2.5%)`, `rgba($black, 0.1)`...).

## Only the classes the site uses

`src/styles.spec.ts` fails when a class of the global CSS is not used by the code. To use another class of Bulma
(`mt-6`, `is-hidden-desktop`, `is-outlined`...), write its rules, from [Bulma 0.9.4](https://github.com/jgthms/bulma/tree/0.9.4/sass)
for example.
