Components in this folder are simple icon, without any behavior

* They can be multi state (means have an argument) like IconCondition.vue
* But they can't handle any logic (v-if), or other elements (tooltip)
* they are all wrapped into a span, to allow parent to inject attributes wihtout interfer with icon rendering
