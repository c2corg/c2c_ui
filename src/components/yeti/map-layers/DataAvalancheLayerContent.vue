<template>
  <div>
    <input-checkbox v-model="dataAvalancheAll" class="mt-2">
      <span v-translate>View all avalanche history</span>
    </input-checkbox>
  </div>
</template>

<script>
import Yetix from '@/components/yeti/Yetix';

export default {
  computed: {
    dataAvalancheAll: {
      get() {
        return Yetix.dataAvalancheAll;
      },
      set(dataAvalancheAll) {
        Yetix.setDataAvalancheAll(dataAvalancheAll);
      },
    },
  },
};
</script>
