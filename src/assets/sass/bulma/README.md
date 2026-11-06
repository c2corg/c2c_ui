# Bulma 0.9.4, migrated to Sass modules

The parts of [Bulma](https://bulma.io) 0.9.4 (MIT License, see `LICENSE`) the site uses, copied from the npm package
(`sass/`) and migrated to the Sass module system, so that Dart Sass prints no deprecation warning (`@import` and the
global functions are removed in Dart Sass 3.0). The CSS is the same as Bulma 0.9.4's (only the order of selectors inside
a few selector lists differs).

This is now our code: the plan (c2corg/c2c_ui#4907) is to replace it, one module at a time, by our own CSS with design
tokens, keeping the class names (`.button`, `.columns`, `.is-primary`...).

Configuration: `../variables.scss` configures `utilities/initial-variables` and `utilities/derived-variables`;
`../main.scss` loads the modules and configures the others (`with (...)` on their first `@use`).

## How it was migrated

With [sass-migrator](https://sass-lang.com/documentation/cli/migrator/) 2.6:

1. `sass-migrator if-function` and `sass-migrator color` on every file;
2. `sass-migrator module --migrate-deps` on an entry file with an `@import` of each `_all.sass`.

And by hand:

- `utilities/functions.sass`: `findLightColor()` and `findDarkColor()` returned `$background` and `$text-strong` for
  a value that is not a color, which made `functions` and `derived-variables` load each other (a module loop). They
  return the value itself;
- `@use "../utilities/extends"` added to the files that `@extend` its placeholders (`%control`, `%unselectable`...): a
  module only extends the selectors of the modules it loads;
- the modules the site does not load removed (navbar, pagination, hero...).
