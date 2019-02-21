General rules : if it's not explicitly explained here, please stick to Javascript and Vue conventions :

* https://vuejs.org/v2/style-guide/
* https://www.w3schools.com/js/js_conventions.asp

Here is the command line that will fix most of issues, and warn about others :

```bash
npm run lint
```

We'll list in this document rules that diverges from general standard, and rules that are not present elsewhere.

## Folder names

Folder's names are always kebab-case, no matter what they contains

## File names

By "describing", we means which data/object is exported.

* Vue single file components are PascalCase : `MyAwesomeComponent.vue`
* Javascript
  * If the file describes a single object constructor, it must be in PascalCase : `AwesomeObject.vue`
  * If the file describes a singleton/object instance, in must be in kebab-case : `config.js`
  * If the file describes one or more mixins, it must be in kebab-case : `document-mixin.js`

## HTML templates

Always use kebab-case names for components and [properties](https://vuejs.org/v2/style-guide/#Prop-name-casing-strongly-recommended).

Don't :

```Html
<template>
    <MyAwesomeComponent FancyProperty="yes" />
</template>
```

Do :

```Html
<template>
    <my-awesome-component fancy-property="yes" />
</template>
```
