// Form containers (BaseForm, FormSection) learn which fields they contain through provide / inject: the fields register
// themselves. It replaces walking $children, which Vue 3 removes.
//
//   container: useFormContainer('baseForm')                          ->  formFields, the registered fields (reactive)
//   field:     useFormField('formSection', reactive({ visible, hasError }))  ->  registered with the nearest container
//
// The field gives its state itself: a <script setup> component in production exposes nothing on its instance proxy
// (its template is inlined), so the container could not read it there.
import { inject, onBeforeUnmount, provide, ref } from 'vue';

// what the containers read: FormSection its visible and hasError, BaseForm its name, hasError, and errorMessage, that it
// also sets from the API errors
export type FormFieldState = {
  visible?: boolean;
  hasError?: boolean;
  name?: string;
  errorMessage?: string | null;
};

type Registry = {
  register(field: FormFieldState): void;
  unregister(field: FormFieldState): void;
};

export function useFormContainer(key: string) {
  const formFields = ref<FormFieldState[]>([]);

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

// in setup(): field is reactive, so that the container follows it
export function useFormField(key: string, field: FormFieldState) {
  const container = inject<Registry | null>(key, null);
  if (!container) {
    return;
  }

  container.register(field);
  onBeforeUnmount(() => container.unregister(field));
}
