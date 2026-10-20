// Vue 3 doesn't expose the internal `_uid` on component instances: components get their own unique id, to build
// unique DOM ids (label for, aria-labelledby...)
let lastUid = 0;

export function nextUid() {
  return ++lastUid;
}

export const uidMixin = {
  data() {
    return { uid: nextUid() };
  },
};
