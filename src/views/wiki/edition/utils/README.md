Utilities for edition views.

# form-row

A row with two parts :

* on left side, a label
* on right side, one or more inputs

This row will be visible if, and only if at least one of its children has `visible` property set to `true`

## Attributes

* `label`, a mandatory string
* `always-visible`, optional boolean
* `is-grouped`, optional boolean, set it to true if you have severals inputs, and you need them to be sticked

## Usage

```html
<!-- with two inputs -->
<form-row :label="$gettext('waypoint')" is-grouped>
    <form-input :document="document" :field="fields.waypoint_type"/>
    <form-input :document="document" :field="fields.title"/>
</form-row>

<!-- with one input, always visible -->

<form-row label="" always-visible>
    <map-view :edited-document="document" />

</form-row>
```

# form-simple-row

``` HTML
<form-simple-row :document="document" :field="fields.title" />
```

# form-input

``` HTML
<form-input :document="document" :field="fields.title"/>
```

TODO : rname everyting
