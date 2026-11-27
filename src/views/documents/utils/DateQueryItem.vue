<template>
  <div>
    <div class="control">
      <label class="label">{{ $filters.uppercaseFirstLetter($gettext('date_start')) }}</label>
      <input class="input" type="date" v-model="value" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();

const value = ref<string | null>(null);

const urlValue = computed({
  get() {
    return (route.query.date as string | undefined) ?? '';
  },
  set(value: string | undefined) {
    const query = Object.assign({}, route.query);
    query.date = value as string;

    if (query.date !== route.query.date) {
      router.push({ query });
    }
  },
});

function compute() {
  urlValue.value = value.value ? value.value : undefined;
}

watch(value, () => compute());

// created
value.value = urlValue.value;
</script>
