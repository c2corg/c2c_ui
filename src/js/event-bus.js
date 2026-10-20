import mitt from 'mitt';

// Events between components that don't know each other. It used to be $root.$on() / $root.$emit(), which Vue 3
// removes; mitt is the replacement its migration guide suggests. A handler gets one argument: pass an object for more.
const bus = mitt();

/** Calls handler on the next `type` event only (mitt has no once()), returns a function that removes it */
export function once(type, handler) {
  const wrapped = (event) => {
    bus.off(type, wrapped);
    handler(event);
  };
  bus.on(type, wrapped);
  return () => bus.off(type, wrapped);
}

export default bus;
