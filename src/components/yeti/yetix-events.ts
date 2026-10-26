import mitt from 'mitt';

// Events of the yeti portal (map-moveend, addFeature, gpx...). It used to be Yetix.$on() / Yetix.$emit(): Vue 3
// removes the events API of components. A handler gets one argument: pass an object for more.
export default mitt();
