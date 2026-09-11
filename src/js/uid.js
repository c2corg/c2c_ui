// Vue 3 no longer exposes an internal `_uid` on the public component instance.
// This provides a replacement for components that used `_uid` to build unique DOM ids.
let uid = 0;

export function nextUid() {
  return uid++;
}
