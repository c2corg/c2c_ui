## TL;DR

In order to optimize distribution files sizes, only used font-awesome icons are included in the project.

## How-to ?

Is you need to use a new icon, please follow this steps :

1. identify your icon name, and icon category (solid or regular). Let's say it's `far fa-terrible-icon`
2. open `/src/js/fa.config.js`
3. in relevant import block (regular or solid), add `faTerribleIcon`
  * please keep alphabetical order
  * and is your icon is `regular`, rename it : `faTerribleIcon as faTerribleIconRegular`
4. in `library.add` block, add `faTerribleIconRegular`
5. that's all, enjoy :

``` html
<fa-icon :icon="['far', 'terrible-icon']"></fa-icon>
```

Oh, and a small reminder : if your remove an icon component from a vue file, please have a rapid check if this icon is used in another source. If not, remove it from `fa.config.js`.

## See more

* [vue-fontawesome Github repo](https://github.com/FortAwesome/vue-fontawesome#recommended)
