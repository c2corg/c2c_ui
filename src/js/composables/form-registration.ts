// Form containers (BaseForm, FormSection) learn which fields they contain through provide / inject: the fields register
// themselves. It replaces walking $children, which Vue 3 removes.
//
//   container: useFormContainer('baseForm')  ->  formFields, the registered fields (reactive)
//   field:     useFormField('baseForm')      ->  registered with the nearest container, if any
import { type ComponentPublicInstance, getCurrentInstance, inject, onBeforeUnmount, provide, ref } from 'vue';

type Registry = {
  register(field: ComponentPublicInstance): void;
  unregister(field: ComponentPublicInstance): void;
};

export function useFormContainer(key: string) {
  const formFields = ref<ComponentPublicInstance[]>([]);

  provide<Registry>(key, {
    register: (field) => formFields.value.push(field),
    unregister: (field) => {
      const index = formFields.value.indexOf(field);
      if (index !== -1) {
        formFields.value.splice(index, 1);
      }
    },
  });

  return { formFields };
}

// in setup(): the field is registered as the component instance, which its container reads (visible, hasError...)
export function useFormField(key: string) {
  const container = inject<Registry | null>(key, null);
  const field = getCurrentInstance()?.proxy;
  if (!container || !field) {
    return;
  }

  container.register(field);
  onBeforeUnmount(() => container.unregister(field));
}
