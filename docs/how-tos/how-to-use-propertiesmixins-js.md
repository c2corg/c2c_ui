## How to use properties-mixins ?

This module provide helpers for props definitions.

### Real life exemple
Example : a lots component will require exactly the same props definitions, let say required document, locale and fields objects. So, here is the code :

``` JavaScript

    // in MyAwesomeComponent.vue

    props:{
        document:{
            type: Object,
            required: true
        },
        locale:{
            type: Object,
            required: true
        },
        fields:{
            type: Object,
            required: true
        },
    }

```

And the same for all component that need this boilerplate definition. So, this module declare all definitions that appear in several modules.

#### Shorter version of our code
Use `prop` object that declare property types :

``` JavaScript

    import { requireDocumentProperty, requireFieldProperty } from "@/js/properties-mixins"

    //...

    mixins : [requireDocumentProperty, requireFieldProperty],

    props:{
        fields:prop.requiredObject, // "fields" does not have shorthand
    }
```
