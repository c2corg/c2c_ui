<template>
  <div class="content">
    <table>
      <tr>
        <th v-translate>Location / elevation / orientation</th>
        <th v-translate>soft snow</th>
        <th v-translate>total snow</th>
        <th v-translate>comment</th>
        <th />
      </tr>
      <tr v-for="(level, i) of levels" :key="i">
        <td><input type="text" class="input" v-model.lazy="level.level_place" /></td>
        <td><input type="text" class="input" v-model.lazy="level.level_snow_height_soft" /></td>
        <td><input type="text" class="input" v-model.lazy="level.level_snow_height_total" /></td>
        <td><input type="text" class="input" v-model.lazy="level.level_comment" /></td>
        <td>
          <delete-button
            class="is-size-2 delete-button"
            v-if="i < levels.length - 1 || isLevelFilled(levels[i])"
            @click="levels.splice(i, 1)"
          />
        </td>
      </tr>
    </table>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, type PropType } from 'vue';

// a snow level of an outing, as the API stores them in a JSON string
type Level = {
  level_place?: string;
  level_snow_height_soft?: string;
  level_snow_height_total?: string;
  level_comment?: string;
};

const props = defineProps({
  // null until the levels of the outing are given
  modelValue: {
    type: String as PropType<string | null>,
    default: null,
  },
});

const emit = defineEmits(['update:modelValue']);

function isLevelFilled(level: Level) {
  return (
    Boolean(level.level_place) ||
    Boolean(level.level_snow_height_soft) ||
    Boolean(level.level_snow_height_total) ||
    Boolean(level.level_comment)
  );
}

const levels = ref<Level[]>([
  ...(props.modelValue ? (JSON.parse(props.modelValue) as Level[]) : []).filter(isLevelFilled),
  {}, // always add empty level in the end
]);

function change() {
  if (isLevelFilled(levels.value[levels.value.length - 1])) {
    levels.value.push({});
  }
  emit('update:modelValue', JSON.stringify(levels.value.filter(isLevelFilled)));
}

watch(levels, change, { deep: true });
</script>
