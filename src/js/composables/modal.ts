// A modal's visibility, shown and hidden by its parent through a template ref (modal.show(), modal.hide())
import { ref } from 'vue';

// the emit of defineEmits<{ show: []; hide: [] }>(): one signature per event
export function useModal(emit: { (event: 'show'): void; (event: 'hide'): void }) {
  const visible = ref(false);

  return {
    visible,
    show() {
      visible.value = true;
      emit('show');
    },
    hide() {
      visible.value = false;
      emit('hide');
    },
  };
}
