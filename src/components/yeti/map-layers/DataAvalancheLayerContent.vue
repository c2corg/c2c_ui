<template>
  <div>
    <input-checkbox v-model="dataAvalancheAll" class="mt-2">
      <span v-translate>View all avalanche history</span>
    </input-checkbox>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import Yetix from '@/components/yeti/yetix';

const dataAvalancheAll = computed({
  get: () => Yetix.dataAvalancheAll as boolean,
  set(value: boolean) {
    Yetix.setDataAvalancheAll(value);
  },
});
</script>
