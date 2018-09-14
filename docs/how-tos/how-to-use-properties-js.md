## How to use properties.js ?

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

    import { prop } from "@/js/properties.js"

    //...

    props:{
        document:prop.requiredObject,
        locale:prop.requiredObject,
        fields:prop.requiredObject,
    }
```


#### Even shorter code

`props` object declares properties with names, and `join()` function compose them :

``` JavaScript
    import { props, join } from "@/js/properties.js"

    //...

    props: join(props.requiredDocument, props.requiredLocale, props.requiredFields),
```

#### And even even better

`props` has most used definitions :

``` JavaScript
    import { props } from "@/js/properties.js"

    //...

    props: props.documentViewProperties,
```

### When to use, and not to use properties.js

If you props definition is present in 2 or more components **in the same context** (which means that if a component needs a modification in this definition, all other components in this context will needs the same modification), you may add it into `props` object. Please take the time to find the most crystal clear name for it. For mono properties definitions, used adjective, then name, like `requiredColor`. For multi properties definitions, append the component context name where this set will appear, and `properties`, like `documentViewProperties`.

If your props definition is present only one times (obviously...), or several times, but not in the same context (meaning that it's a coincidence that they shares the same definition), then declare them in the good old way.
