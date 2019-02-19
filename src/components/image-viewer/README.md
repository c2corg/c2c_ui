Large image viewer. This component is a singleton present on all pages.

Each view must reset it on load :

```js
this.$imageViewer.clear();
```

And each component that display an camptocamp image must add it :

```js
this.$imageViewer.push(imageDocument);
```

