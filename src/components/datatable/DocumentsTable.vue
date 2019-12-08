<template>
  <ag-grid-vue
    style="width: 100%; "
    class="ag-theme-balham"
    :column-defs="columnDefs"
    :default-col-def="dColumnDefs"
    suppress-property-names-check
    :row-data="documents.documents"
    :get-row-class="getRowClass"
    :get-row-node-id="getRowNodeId"
    @grid-ready="onGridReady"
    @sort-changed="sortChanged"
    @cellMouseOver="onHover" />
</template>

<script>
    // https://www.ag-grid.com/vue-getting-started/
  import { AgGridVue } from 'ag-grid-vue';

  import { requireDocumentTypeProperty } from '@/js/properties-mixins';

  import constants from '@/js/constants';

  import OutingDate from './cell-renderers/OutingDate';
  import DocumentLink from './cell-renderers/DocumentLink';
  import DocumentField from './cell-renderers/DocumentField';
  import RouteRating from './cell-renderers/RouteRating';
  import OutingRating from './cell-renderers/OutingRating';
  import MarkerGpsTrace from './cell-renderers/MarkerGpsTrace';
  import MarkerImageCount from './cell-renderers/MarkerImageCount';
  import MarkerCondition from './cell-renderers/MarkerCondition';
  import MarkerQuality from './cell-renderers/MarkerQuality';
  import AreaList from './cell-renderers/AreaList';
  import DocumentContributor from './cell-renderers/DocumentContributor';
  import DocumentActivities from './cell-renderers/DocumentActivities';

  function getColDef(vm, field, options) {
    options = options || {};

    const result = {
      headerName: vm.$gettext(field.name),
      field: field.name,
      _fieldDefinition: field,
      cellRendererFramework: options.cellRendererFramework || DocumentField,
      resizable: true
    };

    return Object.assign(result, options);
  }

  export default {

    components: {
      AgGridVue
    },
    mixins: [ requireDocumentTypeProperty ],

    props: {
      documents: {
        type: Object,
        required: true
      },
      highlightedDocument: {
        type: Object,
        default: null
      }
    },

    data() {
      return {
        columnDefs: null,
        dColumnDefs: { sortable: true }
      };
    },

    watch: {
      documentType: {
        handler: 'computeColumnDefs',
        immediate: true
      },
      highlightedDocument(newValue, oldValue) {
        const rows = [];
        const gridApi = this.gridApi;

        const pushDoc = function(doc) {
          if (doc) {
            rows.push(gridApi.getRowNode(String(doc.document_id)));
          }
        };

        pushDoc(newValue);
        pushDoc(oldValue);

        this.gridApi.redrawRows({ rowNodes: rows });
      }
    },

    methods: {
      onGridReady(params) {
        this.gridApi = params.api;
        let sort_model = [];
        const sort_URL = this.$route.query['sort'];
        if (sort_URL) {
          let sort_item = {};
          for (sort_item of sort_URL.split(',')) {
            if (sort_item[0] === '-') {
              sort_model = sort_model.concat({ colId: sort_item.slice(1), sort: 'desc' });
            } else {
              sort_model = sort_model.concat({ colId: sort_item, sort: 'asc' });
            }
          }
          this.gridApi.setSortModel(sort_model);
        }
      },

      onHover(event) {
        this.$emit('highlightDocument', event.data);
      },

      sortChanged(event) {
        // console.log(event);
        // console.log(this.gridOptions.columnApi.getColumnState());
        // console.log(this.gridOptions.api.getSortModel());
        const sortM = this.gridApi.getSortModel();
        const query = Object.assign({}, this.$route.query);
        let sort_list = [];
        let sort_criteria = {};
        for (sort_criteria of sortM) {
          let sortStr = '';
          if (sort_criteria.sort === 'desc') {
            sortStr = sortStr + '-';
          }
          sortStr = sortStr + sort_criteria.colId;
          sort_list = sort_list.concat(sortStr);
        }
        const sortStr = sort_list.join(',');
        // value['sort'] = sortStr;
        query.sort = sortStr === '' ? undefined : sortStr;

        if (query['sort'] !== this.$route.query['sort']) {
          // we always reset offset to first page
          query.offset = undefined;
          this.$router.push({ query });
        }
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
            getColDef(this, fields.title, { cellRendererFramework: DocumentLink }),
            getColDef(this, fields.area_type)
          ];
        }

        if (this.documentType === 'article') {
          this.columnDefs = [
            getColDef(this, fields.title, { cellRendererFramework: DocumentLink, width: 300 }),
            getColDef(this, fields.activities, { cellRendererFramework: DocumentActivities, width: 300 }),
            getColDef(this, fields.categories, { width: 120 }),
            getColDef(this, fields.article_type, { width: 120 }),
            { cellRendererFramework: MarkerQuality, width: 30 }
          ];
        }

        if (this.documentType === 'book') {
          this.columnDefs = [
            getColDef(this, fields.title, { cellRendererFramework: DocumentLink }),
            getColDef(this, fields.book_types),
            getColDef(this, fields.author),
            getColDef(this, fields.activities, { cellRendererFramework: DocumentActivities, width: 100 }),
            { cellRendererFramework: MarkerQuality, width: 30 }
          ];
        }

        if (this.documentType === 'image') {
          this.columnDefs = [
            getColDef(this, fields.title, { cellRendererFramework: DocumentLink }),
            getColDef(this, { name: 'areas' }, { cellRendererFramework: AreaList }),
            getColDef(this, fields.author),
            getColDef(this, fields.filename)
          ];
        }

        if (this.documentType === 'map') {
          this.columnDefs = [
            getColDef(this, fields.title, { cellRendererFramework: DocumentLink }),
            getColDef(this, { name: 'areas' }, { cellRendererFramework: AreaList }),
            getColDef(this, fields.code),
            getColDef(this, fields.editor),
            { cellRendererFramework: MarkerQuality, width: 30 }
          ];
        }

        if (this.documentType === 'outing') {
          this.columnDefs = [
            getColDef(this, fields.date_end, { width: 120, cellRendererFramework: OutingDate }),
            getColDef(this, fields.title, { cellRendererFramework: DocumentLink }),
            getColDef(this, { name: 'areas' }, { cellRendererFramework: AreaList }),
            getColDef(this, { name: 'contributor' }, { cellRendererFramework: DocumentContributor, width: 100 }),
            getColDef(this, fields.activities, { cellRendererFramework: DocumentActivities, width: 100 }),
            {
              headerName: this.$gettext('elevation'),
              children: [
                getColDef(this, fields.elevation_max, { columnGroupShow: 'closed', width: 100 }),
                getColDef(this, fields.elevation_max, { columnGroupShow: 'open', width: 100 }),
                getColDef(this, fields.height_diff_up, { columnGroupShow: 'open', width: 100 }),
                getColDef(this, fields.height_diff_difficulties, { columnGroupShow: 'open', width: 100 })
              ]
            },
            {
              headerName: this.$gettext('ratings'),
              children: [
                {
                  headerName: this.$gettext('ratings'),
                  cellRendererFramework: OutingRating,
                  columnGroupShow: 'closed',
                  resizable: true,
                  width: 120
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
                getColDef(this, fields.mtb_down_rating, { columnGroupShow: 'open', width: 80 })
              ]
            },

            { cellRendererFramework: MarkerGpsTrace, width: 30 },
            { cellRendererFramework: MarkerImageCount, width: 30 },
            { cellRendererFramework: MarkerCondition, width: 30 },
            { cellRendererFramework: MarkerQuality, width: 30 }
          ];
        }

        if (this.documentType === 'route') {
          this.columnDefs = [
            getColDef(this, fields.title, { cellRendererFramework: DocumentLink }),
            getColDef(this, { name: 'areas' }, { cellRendererFramework: AreaList }),
            getColDef(this, fields.activities, { cellRendererFramework: DocumentActivities, width: 100 }),
            getColDef(this, fields.orientations, { width: 100 }),
            {
              headerName: this.$gettext('elevation'),
              children: [
                getColDef(this, fields.elevation_max, { width: 120 }),
                getColDef(this, fields.elevation_min, { columnGroupShow: 'open', width: 120 }),
                getColDef(this, fields.height_diff_up, { columnGroupShow: 'open', width: 120 }),
                getColDef(this, fields.height_diff_down, { columnGroupShow: 'open', width: 120 }),
                getColDef(this, fields.height_diff_difficulties, { columnGroupShow: 'open', width: 120 })
              ]
            },
            {
              headerName: this.$gettext('ratings'),
              children: [
                {
                  headerName: this.$gettext('ratings'),
                  cellRendererFramework: RouteRating,
                  columnGroupShow: 'closed',
                  resizable: true,
                  width: 120
                },
                getColDef(this, fields.engagement_rating, { columnGroupShow: 'open', width: 80 }),
                getColDef(this, fields.equipment_rating, { columnGroupShow: 'open', width: 80 }),
                getColDef(this, fields.exposition_rock_rating, { columnGroupShow: 'open', width: 80 }),
                getColDef(this, fields.global_rating, { columnGroupShow: 'open', width: 80 }),
                getColDef(this, fields.aid_rating, { columnGroupShow: 'open', width: 80 }),
                getColDef(this, fields.risk_rating, { columnGroupShow: 'open', width: 80 }),
                getColDef(this, fields.rock_free_rating, { columnGroupShow: 'open', width: 80 }),
                getColDef(this, fields.rock_required_rating, { columnGroupShow: 'open', width: 80 })
              ]
            },
            { cellRendererFramework: MarkerGpsTrace, width: 30 },
            { cellRendererFramework: MarkerQuality, width: 30 }
          ];
        }

        if (this.documentType === 'waypoint') {
          this.columnDefs = [
            getColDef(this, fields.title, { cellRendererFramework: DocumentLink }),
            getColDef(this, { name: 'areas' }, { cellRendererFramework: AreaList }),
            getColDef(this, fields.elevation),
            getColDef(this, fields.waypoint_type),
            { cellRendererFramework: MarkerQuality, width: 30 }
          ];
        }

        if (this.documentType === 'xreport') {
          this.columnDefs = [
            getColDef(this, fields.date, { width: 100 }),
            getColDef(this, fields.title, { cellRendererFramework: DocumentLink }),
            getColDef(this, { name: 'areas' }, { cellRendererFramework: AreaList }),
            getColDef(this, fields.event_type, { width: 100 }),
            getColDef(this, fields.activities, { cellRendererFramework: DocumentActivities, width: 100 }),
            {
              headerName: this.$gettext('severity'),
              children: [
                getColDef(this, fields.severity),
                getColDef(this, fields.nb_impacted, { columnGroupShow: 'open' }),
                getColDef(this, fields.nb_participants, { columnGroupShow: 'open' })
              ]
            },
            getColDef(this, fields.elevation, { width: 100 }),
            {
              headerName: this.$gettext('avalanche'),
              children: [
                getColDef(this, fields.avalanche_level, { width: 150 }),
                getColDef(this, fields.avalanche_slope, { columnGroupShow: 'open', width: 120 })
              ]
            },
            { cellRendererFramework: MarkerQuality, width: 30 }
          ];
        }
      }
    }
  };
</script>

<style src="ag-grid-community/dist/styles/ag-grid.css" />
<style src="ag-grid-community/dist/styles/ag-theme-balham.css" />
