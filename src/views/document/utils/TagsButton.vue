<template>
  <a class="todo-button" v-if="canTag" @click="onClick" :title="tooltip" :class="{ active: todo }">
    <fa-icon icon="star" />
  </a>
</template>

<script setup lang="ts">
import { toast } from 'bulma-toast';
import { computed, ref } from 'vue';

import c2c from '@/js/apis/c2c';
import type { DocumentRef } from '@/js/apis/c2c/types';
import { useGlobalProperties } from '@/js/composables/global-properties';
import { documentProperty } from '@/js/properties';

const props = defineProps({ ...documentProperty });

const { $gettext, $user } = useGlobalProperties();

const todo = ref(false);

// a route shown from the API: it has an id
const documentRef = computed(() => props.document as DocumentRef);

const canTag = computed(() => props.document.type === 'r' && $user.isLogged);

const tooltip = computed(() => {
  if (todo.value) {
    return $gettext('Unmark this route as to do');
  } else {
    return $gettext('Mark this route as to do');
  }
});

async function onClick() {
  try {
    await (todo.value ? c2c.tags.remove(documentRef.value) : c2c.tags.add(documentRef.value));
    todo.value = !todo.value;
  } catch {
    toast({
      message: $gettext(`An error occurred, couldn't (un)mark route as to do`),
      type: 'is-danger',
    });
  }
}

// created
if (canTag.value) {
  // on error, let todo be falsy
  c2c.tags.get(documentRef.value).then((response) => {
    todo.value = response.data.todo;
  });
}
</script>

<style scoped lang="scss">
.todo-button.active {
  color: $yellow !important;
}
</style>
