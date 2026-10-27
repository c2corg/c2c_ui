<template>
  <ag-grid-vue
    style="width: 100%"
    class="ag-theme-balham"
    theme="legacy"
    :column-defs="columnDefs"
    :default-col-def="defaultColDef"
    :row-data="documents.documents"
    :get-row-class="getRowClass"
    :get-row-id="getRowId"
    :ensure-dom-order="true"
    :enable-cell-text-selection="true"
    @grid-ready="onGridReady"
    @cell-mouse-over="onHover"
  />
</template>

<script setup lang="ts">
import {
  AllCommunityModule,
  ModuleRegistry,
  type Column,
  type ColDef,
  type ColGroupDef,
  type GetRowIdParams,
  type GridApi,
  type GridReadyEvent,
  type ProcessCellForExportParams,
  type ProcessHeaderForExportParams,
  type RowClassParams,
  type CellMouseOverEvent,
} from 'ag-grid-community';
import { AgGridVue } from 'ag-grid-vue3';
import { onBeforeUnmount, onMounted, shallowRef, toRef, watch, type Component, type PropType } from 'vue';
import { useRoute } from 'vue-router';

import AreaList from './cell-renderers/AreaList.vue';
import DocumentActivities from './cell-renderers/DocumentActivities.vue';
import DocumentAuthor from './cell-renderers/DocumentAuthor.vue';
import DocumentField from './cell-renderers/DocumentField.vue';
import DocumentLink from './cell-renderers/DocumentLink.vue';
import DocumentLinkNewTab from './cell-renderers/DocumentLinkNewTab.vue';
import MarkerCondition from './cell-renderers/MarkerCondition.vue';
import MarkerGpsTrace from './cell-renderers/MarkerGpsTrace.vue';
import MarkerImageCount from './cell-renderers/MarkerImageCount.vue';
import MarkerQuality from './cell-renderers/MarkerQuality.vue';
import MarkerSoftMobility from './cell-renderers/MarkerSoftMobility.vue';
import OutingDate from './cell-renderers/OutingDate.vue';
import OutingRating from './cell-renderers/OutingRating.vue';
import RouteRating from './cell-renderers/RouteRating.vue';

import { useGlobalProperties } from '@/js/composables/global-properties';
import constants from '@/js/constants';
import type Field from '@/js/constants/Field';
import bus from '@/js/event-bus';
import { documentTypeProperty } from '@/js/properties';
import type { C2cDocument } from '@/js/vue-plugins/document-utils';

ModuleRegistry.registerModules([AllCommunityModule]);

// a column, with what the cells and the CSV export need: the field shown, the export of the cell, the header name
type C2cColDef = ColDef & {
  _fieldDefinition?: Partial<Field> & { name: string };
  _exportFormatter?: (document: C2cDocument, field?: string) => unknown;
  _headerName?: string;
};
type ColumnOptions = Omit<C2cColDef, 'cellRenderer'> & { cellRenderer?: Component };

const definitions = constants.objectDefinitions as unknown as Record<string, { fields: Record<string, Field> }>;

const props = defineProps({
  ...documentTypeProperty,
  documents: {
    type: Object as PropType<{ documents: C2cDocument[] }>,
    required: true,
  },
  highlightedDocument: {
    type: Object as PropType<C2cDocument>,
    default: null,
  },
  openInNewTab: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['highlight-document']);

const route = useRoute();
const documentType = toRef(props, 'documentType');
const { $dateUtils, $documentUtils, $gettext } = useGlobalProperties();

function capitalize(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function getColDef(field: Partial<Field> & { name: string }, options: ColumnOptions = {}): C2cColDef {
  const result: C2cColDef = {
    headerName: capitalize($gettext(field.name)),
    field: field.name,
    _fieldDefinition: field,
    cellRenderer: options.cellRenderer ?? DocumentField,
    resizable: true,
  };

  return Object.assign(result, options);
}

const colDefOf = (column: Column) => (column.getColDef() ?? {}) as C2cColDef;

// as ag-grid 28 did: headers of columns outside a group don't span the group header row, and cell data types aren't
// inferred (the arrays of areas or activities have their own renderers)
const defaultColDef = { suppressSpanHeaderHeight: true, cellDataType: false };

// shallow: the cell renderers are components, not state to observe
const columnDefs = shallowRef<(C2cColDef | ColGroupDef)[] | null>(null);
let gridApi: GridApi | null = null;

function onGridReady(params: GridReadyEvent) {
  gridApi = params.api;
}

function onHover(event: CellMouseOverEvent) {
  emit('highlight-document', event.data);
}

function getRowId(params: GetRowIdParams) {
  return String(params.data.document_id);
}

function getRowClass(params: RowClassParams) {
  return params.data === props.highlightedDocument ? 'has-background-grey-lighter' : '';
}

function formatExportHeader(params: ProcessHeaderForExportParams) {
  return colDefOf(params.column).headerName ?? colDefOf(params.column)._headerName ?? '';
}

function formatExportCell(params: ProcessCellForExportParams) {
  const colDef = colDefOf(params.column);
  return (
    colDef._exportFormatter?.(params.node!.data, colDef.field) ??
    (colDef._fieldDefinition?.i18n ? $gettext(params.value, colDef._fieldDefinition.i18nContext) : params.value)
  );
}

function formatOutingDate(document: C2cDocument, field?: string) {
  return $dateUtils.toLocalizedString(document[field!], 'll');
}

function formatAreas(document: C2cDocument) {
  return $documentUtils.getSortedAreaList(document);
}

function formatTitle(document: C2cDocument) {
  return $documentUtils.getDocumentTitle(document, route.params.lang as string);
}

function formatAuthor(document: C2cDocument) {
  return document.author.name;
}

function formatActivities(document: C2cDocument) {
  return document.activities.map((activity: string) => $gettext(activity, 'activities')).join(', ');
}

function formatRating(document: C2cDocument) {
  let rating: string[] = ratings(document, 'global_rating', 'via_ferrata_rating');
  if (document.rock_free_rating) {
    rating = [
      ...rating,
      document.rock_required_rating
        ? document.rock_free_rating + '>' + document.rock_required_rating
        : document.rock_free_rating,
    ];
  }
  rating = [
    ...rating,
    ...ratings(
      document,
      'aid_rating',
      'engagement_rating',
      'risk_rating',
      'equipment_rating',
      'exposition_rock_rating',
      'ice_rating',
      'mixed_rating'
    ),
  ];

  if (document.ski_rating) {
    rating = [...rating, document.ski_rating];
    if (document.ski_exposition || document.labande_global_rating) {
      rating = [...rating, '/'];
    }
  }
  rating = [...rating, ...ratings(document, 'ski_exposition', 'labande_global_rating')];
  if (document.labande_ski_rating) {
    rating = [...rating, '/', document.labande_ski_rating];
  }
  rating = [
    ...rating,
    ...ratings(
      document,
      'snowshoe_rating',
      'hiking_rating',
      'mtb_up_rating',
      'mtb_down_rating',
      'hiking_mtb_exposition'
    ),
  ];
  return rating.join(' ');
}

function ratings(document: C2cDocument, ...names: string[]): string[] {
  return names.map((rating) => document[rating]).filter((rating) => !!rating);
}

function formatGpsTrace(document: C2cDocument) {
  return document.geometry?.has_geom_detail ? $gettext('yes') : $gettext('no');
}

function formatImagesCount(document: C2cDocument) {
  return document.img_count;
}

function formatSoftMobility(document: C2cDocument) {
  return document.public_transport ? $gettext('yes') : $gettext('no');
}

function formatConditions(document: C2cDocument) {
  return document.condition_rating ? $gettext(document.condition_rating, 'condition_ratings') : '';
}

function formatQuality(document: C2cDocument) {
  return $gettext(document.quality, 'quality_types');
}

function computeColumnDefs() {
  const fields = definitions[documentType.value].fields;

  if (documentType.value === 'area') {
    columnDefs.value = [
      getColDef(fields.title, {
        cellRenderer: props.openInNewTab ? DocumentLinkNewTab : DocumentLink,
        _exportFormatter: formatTitle,
      }),
      getColDef(fields.area_type),
    ];
  }

  if (documentType.value === 'article') {
    columnDefs.value = [
      getColDef(fields.title, {
        cellRenderer: props.openInNewTab ? DocumentLinkNewTab : DocumentLink,
        _exportFormatter: formatTitle,
        width: 300,
      }),
      getColDef(fields.activities, {
        cellRenderer: DocumentActivities,
        _exportFormatter: formatActivities,
        width: 300,
      }),
      getColDef(fields.categories, { width: 120 }),
      getColDef(fields.article_type, { width: 120 }),
      {
        cellRenderer: MarkerQuality,
        _exportFormatter: formatQuality,
        _headerName: capitalize($gettext('Document quality')),
        width: 30,
      },
    ];
  }

  if (documentType.value === 'book') {
    columnDefs.value = [
      getColDef(fields.title, {
        cellRenderer: props.openInNewTab ? DocumentLinkNewTab : DocumentLink,
        _exportFormatter: formatTitle,
      }),
      getColDef(fields.book_types),
      getColDef(fields.author),
      getColDef(fields.activities, {
        cellRenderer: DocumentActivities,
        _exportFormatter: formatActivities,
        width: 100,
      }),
      {
        cellRenderer: MarkerQuality,
        _exportFormatter: formatQuality,
        _headerName: capitalize($gettext('Document quality')),
        width: 30,
      },
    ];
  }

  if (documentType.value === 'image') {
    columnDefs.value = [
      getColDef(fields.title, {
        cellRenderer: props.openInNewTab ? DocumentLinkNewTab : DocumentLink,
        _exportFormatter: formatTitle,
      }),
      getColDef({ name: 'areas' }, { cellRenderer: AreaList, _exportFormatter: formatAreas }),
      getColDef(fields.author),
      getColDef(fields.filename),
    ];
  }

  if (documentType.value === 'map') {
    columnDefs.value = [
      getColDef(fields.title, {
        cellRenderer: props.openInNewTab ? DocumentLinkNewTab : DocumentLink,
        _exportFormatter: formatTitle,
      }),
      getColDef({ name: 'areas' }, { cellRenderer: AreaList, _exportFormatter: formatAreas }),
      getColDef(fields.code),
      getColDef(fields.editor),
      {
        cellRenderer: MarkerQuality,
        _exportFormatter: formatQuality,
        _headerName: capitalize($gettext('Document quality')),
        width: 30,
      },
    ];
  }

  if (documentType.value === 'outing') {
    columnDefs.value = [
      getColDef(fields.date_end, {
        width: 90,
        cellRenderer: OutingDate,
        _exportFormatter: formatOutingDate,
      }),
      getColDef(fields.title, {
        cellRenderer: props.openInNewTab ? DocumentLinkNewTab : DocumentLink,
        _exportFormatter: formatTitle,
      }),
      getColDef(
        { name: 'areas' },
        {
          cellRenderer: AreaList,
          _exportFormatter: formatAreas,
        }
      ),
      getColDef({ name: 'contributor' }, { cellRenderer: DocumentAuthor, _exportFormatter: formatAuthor, width: 100 }),
      getColDef(fields.activities, {
        cellRenderer: DocumentActivities,
        _exportFormatter: formatActivities,
        width: 100,
      }),
      {
        headerName: capitalize($gettext('elevation')),
        children: [
          getColDef(fields.elevation_max, { columnGroupShow: 'closed', width: 100 }),
          getColDef(fields.elevation_max, { columnGroupShow: 'open', width: 100 }),
          getColDef(fields.height_diff_up, { columnGroupShow: 'open', width: 100 }),
          getColDef(fields.height_diff_difficulties, { columnGroupShow: 'open', width: 100 }),
        ],
      },
      {
        headerName: capitalize($gettext('ratings')),
        children: [
          {
            headerName: capitalize($gettext('ratings')),
            cellRenderer: OutingRating,
            _exportFormatter: formatRating,
            columnGroupShow: 'closed',
            resizable: true,
            width: 120,
          },
          getColDef(fields.global_rating, { columnGroupShow: 'open', width: 80 }),
          getColDef(fields.rock_free_rating, { columnGroupShow: 'open', width: 80 }),
          getColDef(fields.ice_rating, { columnGroupShow: 'open', width: 80 }),
          getColDef(fields.via_ferrata_rating, { columnGroupShow: 'open', width: 80 }),
          getColDef(fields.equipment_rating, { columnGroupShow: 'open', width: 80 }),
          getColDef(fields.engagement_rating, { columnGroupShow: 'open', width: 80 }),
          getColDef(fields.ski_rating, { columnGroupShow: 'open', width: 80 }),
          getColDef(fields.labande_global_rating, { columnGroupShow: 'open', width: 80 }),
          getColDef(fields.hiking_rating, { columnGroupShow: 'open', width: 80 }),
          getColDef(fields.snowshoe_rating, { columnGroupShow: 'open', width: 80 }),
          getColDef(fields.mtb_up_rating, { columnGroupShow: 'open', width: 80 }),
          getColDef(fields.mtb_down_rating, { columnGroupShow: 'open', width: 80 }),
        ],
      },

      {
        cellRenderer: MarkerGpsTrace,
        _exportFormatter: formatGpsTrace,
        _headerName: capitalize($gettext('Trace')),
        width: 20,
      },
      {
        cellRenderer: MarkerImageCount,
        _exportFormatter: formatImagesCount,
        _headerName: capitalize($gettext('Image count')),
        width: 20,
      },
      {
        cellRenderer: MarkerSoftMobility,
        _exportFormatter: formatSoftMobility,
        _headerName: capitalize($gettext('Soft mobility outing')),
        width: 20,
      },
      {
        cellRenderer: MarkerCondition,
        _exportFormatter: formatConditions,
        _headerName: capitalize($gettext('Conditions')),
        width: 20,
      },
      {
        cellRenderer: MarkerQuality,
        _exportFormatter: formatQuality,
        _headerName: capitalize($gettext('Document quality')),
        width: 20,
      },
    ];
  }

  if (documentType.value === 'route') {
    columnDefs.value = [
      getColDef(fields.title, {
        cellRenderer: props.openInNewTab ? DocumentLinkNewTab : DocumentLink,
        _exportFormatter: formatTitle,
      }),
      getColDef({ name: 'areas' }, { cellRenderer: AreaList, _exportFormatter: formatAreas }),
      getColDef(fields.activities, {
        cellRenderer: DocumentActivities,
        _exportFormatter: formatActivities,
        width: 100,
      }),
      getColDef(fields.orientations, { width: 100 }),
      {
        headerName: $gettext('elevation'),
        children: [
          getColDef(fields.elevation_max, { width: 120 }),
          getColDef(fields.elevation_min, { columnGroupShow: 'open', width: 120 }),
          getColDef(fields.height_diff_up, { columnGroupShow: 'open', width: 120 }),
          getColDef(fields.height_diff_down, { columnGroupShow: 'open', width: 120 }),
          getColDef(fields.height_diff_difficulties, { columnGroupShow: 'open', width: 120 }),
        ],
      },
      {
        headerName: $gettext('ratings'),
        children: [
          {
            headerName: $gettext('ratings'),
            cellRenderer: RouteRating,
            _exportFormatter: formatRating,
            columnGroupShow: 'closed',
            resizable: true,
            width: 120,
          },
          getColDef(fields.engagement_rating, { columnGroupShow: 'open', width: 80 }),
          getColDef(fields.equipment_rating, { columnGroupShow: 'open', width: 80 }),
          getColDef(fields.exposition_rock_rating, { columnGroupShow: 'open', width: 80 }),
          getColDef(fields.global_rating, { columnGroupShow: 'open', width: 80 }),
          getColDef(fields.aid_rating, { columnGroupShow: 'open', width: 80 }),
          getColDef(fields.risk_rating, { columnGroupShow: 'open', width: 80 }),
          getColDef(fields.rock_free_rating, { columnGroupShow: 'open', width: 80 }),
          getColDef(fields.rock_required_rating, { columnGroupShow: 'open', width: 80 }),
        ],
      },
      {
        cellRenderer: MarkerGpsTrace,
        _exportFormatter: formatGpsTrace,
        _headerName: capitalize($gettext('Trace')),
        width: 30,
      },
      {
        cellRenderer: MarkerQuality,
        _exportFormatter: formatQuality,
        _headerName: capitalize($gettext('Document quality')),
        width: 30,
      },
    ];
  }

  if (documentType.value === 'waypoint') {
    columnDefs.value = [
      getColDef(fields.title, {
        cellRenderer: props.openInNewTab ? DocumentLinkNewTab : DocumentLink,
        _exportFormatter: formatTitle,
      }),
      getColDef({ name: 'areas' }, { cellRenderer: AreaList, _exportFormatter: formatAreas }),
      getColDef(fields.elevation),
      getColDef(fields.waypoint_type),
      {
        cellRenderer: MarkerQuality,
        _exportFormatter: formatQuality,
        _headerName: capitalize($gettext('Document quality')),
        width: 30,
      },
    ];
  }

  if (documentType.value === 'xreport') {
    columnDefs.value = [
      getColDef(fields.date, { width: 100 }),
      getColDef(fields.title, {
        cellRenderer: props.openInNewTab ? DocumentLinkNewTab : DocumentLink,
        _exportFormatter: formatTitle,
      }),
      getColDef({ name: 'areas' }, { cellRenderer: AreaList, _exportFormatter: formatAreas }),
      getColDef(fields.event_type, { width: 100 }),
      getColDef(fields.event_activity, { width: 100 }),
      {
        headerName: $gettext('severity'),
        children: [
          getColDef(fields.severity),
          getColDef(fields.nb_impacted, { columnGroupShow: 'open' }),
          getColDef(fields.nb_participants, { columnGroupShow: 'open' }),
        ],
      },
      getColDef(fields.elevation, { width: 100 }),
      {
        headerName: $gettext('avalanche'),
        children: [
          getColDef(fields.avalanche_level, { width: 150 }),
          getColDef(fields.avalanche_slope, { columnGroupShow: 'open', width: 120 }),
        ],
      },
      {
        cellRenderer: MarkerQuality,
        _exportFormatter: formatQuality,
        _headerName: capitalize($gettext('Document quality')),
        width: 30,
      },
    ];
  }
}

function exportCsv() {
  gridApi!.exportDataAsCsv({
    processCellCallback: formatExportCell,
    processHeaderCallback: formatExportHeader,
  });
}

watch(documentType, computeColumnDefs, { immediate: true });

watch(
  () => props.highlightedDocument,
  (newValue, oldValue) => {
    const rows = [];

    for (const doc of [newValue, oldValue]) {
      if (doc) {
        rows.push(gridApi!.getRowNode(String(doc.document_id))!);
      }
    }

    gridApi!.redrawRows({ rowNodes: rows });
  }
);

onMounted(() => {
  bus.on('table-csv-export', exportCsv);
});

onBeforeUnmount(() => {
  bus.off('table-csv-export', exportCsv);
});
</script>

<style src="ag-grid-community/styles/ag-grid.css" />
<style src="ag-grid-community/styles/ag-theme-balham.css" />
<style lang="scss">
.ag-theme-balham .ag-cell {
  padding-left: 0;
  padding-right: 0;
}
</style>
