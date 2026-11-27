// Whether the menu panel of the phone layout (MobileMenu.vue) is open: toggled by the Menu tab of the bottom bar
import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useMobileMenuStore = defineStore('mobile-menu', () => {
  const isOpen = ref(false);

  return {
    isOpen,
    toggle: () => (isOpen.value = !isOpen.value),
    close: () => (isOpen.value = false),
  };
});
