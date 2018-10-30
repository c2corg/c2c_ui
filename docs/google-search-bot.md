Chrome google bot use [chrome 41](https://developers.google.com/search/docs/guides/rendering), current version is 70 (as of october 2018). So we must pay attention to not use any feature, espacially javascript features, that are not supported by Chrome.

The strategy on this is quite limited, because we must also test any dependancies ([vue-moment](https://github.com/brockpetrie/vue-moment), we're talking about you...). The best we have is quite manual :

1. Get knowledge of DO and DON'T
2. And manually test it :
  1. Install [Chormium 41](https://commondatastorage.googleapis.com/chromium-browser-snapshots/index.html?prefix=Win/310958/), it work's fine on Windows, not on MacOSX
  2. open your dev site and check that everything is fine
  3. you can also check google search console, with "fetch as google" tool


### Do **not** use :

#### Three dot operator

```
function foo(...args){
}
```
