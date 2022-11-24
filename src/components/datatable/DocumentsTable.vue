<template>
  <ag-grid-vue
    style="width: 100%"
    class="ag-theme-balham"
    :column-defs="columnDefs"
    suppress-property-names-check
    :row-data="documents.documents"
    :get-row-class="getRowClass"
    :get-row-node-id="getRowNodeId"
    :ensure-dom-order="true"
    :enable-cell-text-selection="true"
    @grid-ready="onGridReady"
    @cellMouseOver="onHover"
  />
</template>

<script>
import { AgGridVue } from 'ag-grid-vue';

import AreaList from './cell-renderers/AreaList';
import DocumentActivities from './cell-renderers/DocumentActivities';
import DocumentAuthor from './cell-renderers/DocumentAuthor';
import DocumentField from './cell-renderers/DocumentField';
import DocumentLink from './cell-renderers/DocumentLink';
import MarkerCondition from './cell-renderers/MarkerCondition';
import MarkerGpsTrace from './cell-renderers/MarkerGpsTrace';
import MarkerImageCount from './cell-renderers/MarkerImageCount';
import MarkerQuality from './cell-renderers/MarkerQuality';
import MarkerSoftMobility from './cell-renderers/MarkerSoftMobility.vue';
import OutingDate from './cell-renderers/OutingDate';
import OutingRating from './cell-renderers/OutingRating';
import RouteRating from './cell-renderers/RouteRating';

import constants from '@/js/constants';
import { requireDocumentTypeProperty } from '@/js/properties-mixins';

function getColDef(vm, field, options = {}) {
  const result = {
    headerName: capitalize(vm.$gettext(field.name)),
    field: field.name,
    _fieldDefinition: field,
    cellRendererFramework: options.cellRendererFramework ?? DocumentField,
    _exportRenderer: options._exportRendered,
    resizable: true,
  };

  return Object.assign(result, options);
}

function capitalize(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

export default {
  components: {
    AgGridVue,
  },
  mixins: [requireDocumentTypeProperty],

  props: {
    documents: {
      type: Object,
      required: true,
    },
    highlightedDocument: {
      type: Object,
      default: null,
    },
  },

  data() {
    return {
      columnDefs: null,
    };
  },

  watch: {
    documentType: {
      handler: 'computeColumnDefs',
      immediate: true,
    },
    highlightedDocument(newValue, oldValue) {
      const rows = [];
      const gridApi = this.gridApi;

      const pushDoc = function (doc) {
        if (doc) {
          rows.push(gridApi.getRowNode(String(doc.document_id)));
        }
      };

      pushDoc(newValue);
      pushDoc(oldValue);

      this.gridApi.redrawRows({ rowNodes: rows });
    },
  },

  mounted() {
    this.$root.$on('table-csv-export', () => this.exportCsv());
  },

  methods: {
    onGridReady(params) {
      this.gridApi = params.api;
    },

    onHover(event) {
      this.$emit('highlight-document', event.data);
    },

    getRowNodeId(document) {
      return String(document.document_id);
    },

    getRowClass(params) {
      return params.data === this.highlightedDocument ? 'has-background-grey-lighter' : '';
    },

    computeColumnDefs() {
      const fields = constants.objectDefinitions[this.documentType].fields;

      if (this.documentType === 'area') {
        this.columnDefs = [
          getColDef(this, fields.title, { cellRendererFramework: DocumentLink, _exportFormatter: this.formatTitle }),
          getColDef(this, fields.area_type),
        ];
      }

      if (this.documentType === 'article') {
        this.columnDefs = [
          getColDef(this, fields.title, {
            cellRendererFramework: DocumentLink,
            _exportFormatter: this.formatTitle,
            width: 300,
          }),
          getColDef(this, fields.activities, {
            cellRendererFramework: DocumentActivities,
            _exportFormatter: this.formatActivities,
            width: 300,
          }),
          getColDef(this, fields.categories, { width: 120 }),
          getColDef(this, fields.article_type, { width: 120 }),
          {
            cellRendererFramework: MarkerQuality,
            _exportFormatter: this.formatQuality,
            _headerName: capitalize(this.$gettext('Document quality')),
            width: 30,
          },
        ];
      }

      if (this.documentType === 'book') {
        this.columnDefs = [
          getColDef(this, fields.title, { cellRendererFramework: DocumentLink, _exportFormatter: this.formatTitle }),
          getColDef(this, fields.book_types),
          getColDef(this, fields.author),
          getColDef(this, fields.activities, {
            cellRendererFramework: DocumentActivities,
            _exportFormatter: this.formatActivities,
            width: 100,
          }),
          {
            cellRendererFramework: MarkerQuality,
            _exportFormatter: this.formatQuality,
            _headerName: capitalize(this.$gettext('Document quality')),
            width: 30,
          },
        ];
      }

      if (this.documentType === 'image') {
        this.columnDefs = [
          getColDef(this, fields.title, { cellRendererFramework: DocumentLink, _exportFormatter: this.formatTitle }),
          getColDef(this, { name: 'areas' }, { cellRendererFramework: AreaList, _exportFormatter: this.formatAreas }),
          getColDef(this, fields.author),
          getColDef(this, fields.filename),
        ];
      }

      if (this.documentType === 'map') {
        this.columnDefs = [
          getColDef(this, fields.title, { cellRendererFramework: DocumentLink, _exportFormatter: this.formatTitle }),
          getColDef(this, { name: 'areas' }, { cellRendererFramework: AreaList, _exportFormatter: this.formatAreas }),
          getColDef(this, fields.code),
          getColDef(this, fields.editor),
          {
            cellRendererFramework: MarkerQuality,
            _exportFormatter: this.formatQuality,
            _headerName: capitalize(this.$gettext('Document quality')),
            width: 30,
          },
        ];
      }

      if (this.documentType === 'outing') {
        this.columnDefs = [
          getColDef(this, fields.date_end, {
            width: 90,
            cellRendererFramework: OutingDate,
            _exportFormatter: this.formatOutingDate,
          }),
          getColDef(this, fields.title, { cellRendererFramework: DocumentLink, _exportFormatter: this.formatTitle }),
          getColDef(
            this,
            { name: 'areas' },
            {
              cellRendererFramework: AreaList,
              _exportFormatter: this.formatAreas,
            }
          ),
          getColDef(
            this,
            { name: 'contributor' },
            { cellRendererFramework: DocumentAuthor, _exportFormatter: this.formatAuthor, width: 100 }
          ),
          getColDef(this, fields.activities, {
            cellRendererFramework: DocumentActivities,
            _exportFormatter: this.formatActivities,
            width: 100,
          }),
          {
            headerName: capitalize(this.$gettext('elevation')),
            children: [
              getColDef(this, fields.elevation_max, { columnGroupShow: 'closed', width: 100 }),
              getColDef(this, fields.elevation_max, { columnGroupShow: 'open', width: 100 }),
              getColDef(this, fields.height_diff_up, { columnGroupShow: 'open', width: 100 }),
              getColDef(this, fields.height_diff_difficulties, { columnGroupShow: 'open', width: 100 }),
            ],
          },
          {
            headerName: capitalize(this.$gettext('ratings')),
            children: [
              {
                headerName: capitalize(this.$gettext('ratings')),
                cellRendererFramework: OutingRating,
                _exportFormatter: this.formatRating,
                columnGroupShow: 'closed',
                resizable: true,
                width: 120,
              },
              getColDef(this, fields.global_rating, { columnGroupShow: 'open', width: 80 }),
              getColDef(this, fields.rock_free_rating, { columnGroupShow: 'open', width: 80 }),
              getColDef(this, fields.ice_rating, { columnGroupShow: 'open', width: 80 }),
              getColDef(this, fields.via_ferrata_rating, { columnGroupShow: 'open', width: 80 }),
              getColDef(this, fields.equipment_rating, { columnGroupShow: 'open', width: 80 }),
              getColDef(this, fields.engagement_rating, { columnGroupShow: 'open', width: 80 }),
              getColDef(this, fields.ski_rating, { columnGroupShow: 'open', width: 80 }),
              getColDef(this, fields.labande_global_rating, { columnGroupShow: 'open', width: 80 }),
              getColDef(this, fields.hiking_rating, { columnGroupShow: 'open', width: 80 }),
              getColDef(this, fields.snowshoe_rating, { columnGroupShow: 'open', width: 80 }),
              getColDef(this, fields.mtb_up_rating, { columnGroupShow: 'open', width: 80 }),
              getColDef(this, fields.mtb_down_rating, { columnGroupShow: 'open', width: 80 }),
            ],
          },

          {
            cellRendererFramework: MarkerGpsTrace,
            _exportFormatter: this.formatGpsTrace,
            _headerName: capitalize(this.$gettext('Trace')),
            width: 20,
          },
          {
            cellRendererFramework: MarkerImageCount,
            _exportFormatter: this.formatImagesCount,
            _headerName: capitalize(this.$gettext('Image count')),
            width: 20,
          },
          {
            cellRendererFramework: MarkerSoftMobility,
            _exportFormatter: this.formatSoftMobility,
            _headerName: capitalize(this.$gettext('Soft mobility outing')),
            width: 20,
          },
          {
            cellRendererFramework: MarkerCondition,
            _exportFormatter: this.formatConditions,
            _headerName: capitalize(this.$gettext('Conditions')),
            width: 20,
          },
          {
            cellRendererFramework: MarkerQuality,
            _exportFormatter: this.formatQuality,
            _headerName: capitalize(this.$gettext('Document quality')),
            width: 20,
          },
        ];
      }

      if (this.documentType === 'route') {
        this.columnDefs = [
          getColDef(this, fields.title, { cellRendererFramework: DocumentLink, _exportFormatter: this.formatTitle }),
          getColDef(this, { name: 'areas' }, { cellRendererFramework: AreaList, _exportFormatter: this.formatAreas }),
          getColDef(this, fields.activities, {
            cellRendererFramework: DocumentActivities,
            _exportFormatter: this.formatActivities,
            width: 100,
          }),
          getColDef(this, fields.orientations, { width: 100 }),
          {
            headerName: this.$gettext('elevation'),
            children: [
              getColDef(this, fields.elevation_max, { width: 120 }),
              getColDef(this, fields.elevation_min, { columnGroupShow: 'open', width: 120 }),
              getColDef(this, fields.height_diff_up, { columnGroupShow: 'open', width: 120 }),
              getColDef(this, fields.height_diff_down, { columnGroupShow: 'open', width: 120 }),
              getColDef(this, fields.height_diff_difficulties, { columnGroupShow: 'open', width: 120 }),
            ],
          },
          {
            headerName: this.$gettext('ratings'),
            children: [
              {
                headerName: this.$gettext('ratings'),
                cellRendererFramework: RouteRating,
                _exportFormatter: this.formatRating,
                columnGroupShow: 'closed',
                resizable: true,
                width: 120,
              },
              getColDef(this, fields.engagement_rating, { columnGroupShow: 'open', width: 80 }),
              getColDef(this, fields.equipment_rating, { columnGroupShow: 'open', width: 80 }),
              getColDef(this, fields.exposition_rock_rating, { columnGroupShow: 'open', width: 80 }),
              getColDef(this, fields.global_rating, { columnGroupShow: 'open', width: 80 }),
              getColDef(this, fields.aid_rating, { columnGroupShow: 'open', width: 80 }),
              getColDef(this, fields.risk_rating, { columnGroupShow: 'open', width: 80 }),
              getColDef(this, fields.rock_free_rating, { columnGroupShow: 'open', width: 80 }),
              getColDef(this, fields.rock_required_rating, { columnGroupShow: 'open', width: 80 }),
            ],
          },
          {
            cellRendererFramework: MarkerGpsTrace,
            _exportFormatter: this.formatGpsTrace,
            _headerName: capitalize(this.$gettext('Trace')),
            width: 30,
          },
          {
            cellRendererFramework: MarkerQuality,
            _exportFormatter: this.formatQuality,
            _headerName: capitalize(this.$gettext('Document quality')),
            width: 30,
          },
        ];
      }

      if (this.documentType === 'waypoint') {
        this.columnDefs = [
          getColDef(this, fields.title, { cellRendererFramework: DocumentLink, _exportFormatter: this.formatTitle }),
          getColDef(this, { name: 'areas' }, { cellRendererFramework: AreaList, _exportFormatter: this.formatAreas }),
          getColDef(this, fields.elevation),
          getColDef(this, fields.waypoint_type),
          {
            cellRendererFramework: MarkerQuality,
            _exportFormatter: this.formatQuality,
            _headerName: capitalize(this.$gettext('Document quality')),
            width: 30,
          },
        ];
      }

      if (this.documentType === 'xreport') {
        this.columnDefs = [
          getColDef(this, fields.date, { width: 100 }),
          getColDef(this, fields.title, { cellRendererFramework: DocumentLink, _exportFormatter: this.formatTitle }),
          getColDef(this, { name: 'areas' }, { cellRendererFramework: AreaList, _exportFormatter: this.formatAreas }),
          getColDef(this, fields.event_type, { width: 100 }),
          getColDef(this, fields.event_activity, { width: 100 }),
          {
            headerName: this.$gettext('severity'),
            children: [
              getColDef(this, fields.severity),
              getColDef(this, fields.nb_impacted, { columnGroupShow: 'open' }),
              getColDef(this, fields.nb_participants, { columnGroupShow: 'open' }),
            ],
          },
          getColDef(this, fields.elevation, { width: 100 }),
          {
            headerName: this.$gettext('avalanche'),
            children: [
              getColDef(this, fields.avalanche_level, { width: 150 }),
              getColDef(this, fields.avalanche_slope, { columnGroupShow: 'open', width: 120 }),
            ],
          },
          {
            cellRendererFramework: MarkerQuality,
            _exportFormatter: this.formatQuality,
            _headerName: capitalize(this.$gettext('Document quality')),
            width: 30,
          },
        ];
      }
    },

    exportCsv() {
      this.gridApi.exportDataAsCsv({
        processCellCallback: this.formatExportCell,
        processHeaderCallback: this.formatExportHeader,
      });
    },

    formatExportHeader(params) {
      return params.column.colDef?.headerName ?? params.column.colDef?._headerName ?? undefined;
    },

    formatExportCell(params) {
      return (
        params.column.colDef?._exportFormatter?.(params.node.data, params.column.colDef.field) ??
        (params.column.colDef?._fieldDefinition?.i18n
          ? this.$gettext(params.value, params.column.colDef._fieldDefinition.i18nContext)
          : params.value)
      );
    },

    formatOutingDate(document, field) {
      return this.$dateUtils.toLocalizedString(document[field], 'll');
    },

    formatAreas(document) {
      return this.$documentUtils.getSortedAreaList(document);
    },

    formatTitle(document) {
      return this.$documentUtils.getDocumentTitle(document, this.$route.params.lang);
    },

    formatAuthor(document) {
      return document.author.name;
    },

    formatActivities(document) {
      return document.activities.map((activity) => this.$gettext(activity, 'activities')).join(', ');
    },

    formatRating(document) {
      let rating = this.ratings(document, 'global_rating', 'via_ferrata_rating');
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
        ...this.ratings(
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
      rating = [...rating, ...this.ratings(document, 'ski_exposition', 'labande_global_rating')];
      if (document.labande_ski_rating) {
        rating = [...rating, '/', document.labande_ski_rating];
      }
      rating = [
        ...rating,
        ...this.ratings(
          document,
          'snowshoe_rating',
          'hiking_rating',
          'mtb_up_rating',
          'mtb_down_rating',
          'hiking_mtb_exposition'
        ),
      ];
      return rating.join(' ');
    },

    ratings(document, ...ratings) {
      return ratings.map((rating) => document[rating]).filter((rating) => !!rating);
    },

    formatGpsTrace(document) {
      return document.geometry.has_geom_detail ? this.$gettext('yes') : this.$gettext('no');
    },

    formatImagesCount(document) {
      return document.img_count;
    },

    formatSoftMobility(document) {
      return document.public_transport ? this.$gettext('yes') : this.$gettext('no');
    },

    formatConditions(document) {
      return document.condition_rating ? this.$gettext(document.condition_rating, 'condition_ratings') : '';
    },

    formatQuality(document) {
      return this.$gettext(document.quality, 'quality_types');
    },
  },
};
</script>

<style src="ag-grid-community/dist/styles/ag-grid.css" />
<style src="ag-grid-community/dist/styles/ag-theme-balham.css" />
<style lang="scss">
.ag-theme-balham .ag-cell {
  padding-left: 0;
  padding-right: 0;
}
</style>
