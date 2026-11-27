<template>
  <generic-document-field :document="params.data" :field="field" />
</template>

<script setup lang="ts">
import type { ICellRendererParams } from 'ag-grid-community';
import { computed, type PropType } from 'vue';

// named apart from this renderer, which has the same name
import GenericDocumentField from '@/components/generics/DocumentField.vue';
import type Field from '@/js/constants/Field';

// the grid gives each cell its params: the row document is params.data
const props = defineProps({
  params: {
    type: Object as PropType<ICellRendererParams>,
    required: true,
  },
});

// the field of the column, set by DocumentsTable
const field = computed(() => (props.params.colDef as { _fieldDefinition: Field })._fieldDefinition);
</script>
