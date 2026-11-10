import mitt from 'mitt';

// Events between components that don't know each other. It used to be $root.$on() / $root.$emit(), which Vue 3
// removes; mitt is the replacement its migration guide suggests. A handler gets one argument: pass an object for more.
// events and their argument: not typed per event yet
const bus = mitt<Record<string, unknown>>();

/** Calls handler on the next `type` event only (mitt has no once()), returns a function that removes it */
export function once(type: string, handler: (event: unknown) => void): () => void {
  const wrapped = (event: unknown) => {
    bus.off(type, wrapped);
    handler(event);
  };
  bus.on(type, wrapped);
  return () => bus.off(type, wrapped);
}

export default bus;
