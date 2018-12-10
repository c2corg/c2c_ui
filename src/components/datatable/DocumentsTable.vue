<template>
    <ag-grid-vue style="width: 100%; "
                 class="ag-theme-balham"
                 :column-defs="columnDefs"
                 enable-col-resize
                 suppress-property-names-check
                 :row-data="documents.documents"/>
</template>

<script>
    // https://www.ag-grid.com/vue-getting-started/
    import { AgGridVue } from 'ag-grid-vue'

    import { requireDocumentTypeProperty } from '@/js/properties-mixins'

    import constants from '@/js/constants'

    import DocumentLink from './cell-renderers/DocumentLink'
    import DocumentField from './cell-renderers/DocumentField'
    import RouteRating from './cell-renderers/RouteRating'
    import MarkerGpsTrace from './cell-renderers/MarkerGpsTrace'
    import MarkerImageCount from './cell-renderers/MarkerImageCount'
    import MarkerCondition from './cell-renderers/MarkerCondition'
    import MarkerQuality from './cell-renderers/MarkerQuality'
    import AreaList from './cell-renderers/AreaList'

    function getColDef(vm, field, cellRendererFramework, options) {
        const result = {
            headerName: vm.$gettext(field.name),
            field: field.name,
            _fieldDefinition: field,
            cellRendererFramework: cellRendererFramework || DocumentField
        }

        return Object.assign(result, options)
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
            }
        },

        data() {
            return {
                columnDefs: null
            }
        },

        beforeMount() {
            if (this.documentType === 'area') {
                let fields = constants.objectDefinitions.area.fields
                this.columnDefs = [
                    getColDef(this, fields.title, DocumentLink),
                    getColDef(this, fields.area_type)
                ]
            }

            if (this.documentType === 'article') {
                let fields = constants.objectDefinitions.article.fields
                this.columnDefs = [
                    getColDef(this, fields.title, DocumentLink),
                    getColDef(this, fields.quality),
                    getColDef(this, fields.activities),
                    getColDef(this, fields.categories),
                    getColDef(this, fields.article_type),
                    getColDef(this, fields.quality)
                ]
            }

            if (this.documentType === 'outing') {
                let fields = constants.objectDefinitions.outing.fields
                this.columnDefs = [
                    getColDef(this, fields.date_start, undefined, { width: 100 }),
                    getColDef(this, fields.title, DocumentLink),
                    getColDef(this, { name: 'Areas' }, AreaList),
                    getColDef(this, fields.activities, undefined, { width: 100 }),
                    getColDef(this, fields.height_diff_up, undefined, { width: 100 }),
                    { cellRendererFramework: MarkerGpsTrace, width: 30 },
                    { cellRendererFramework: MarkerImageCount, width: 30 },
                    { cellRendererFramework: MarkerCondition, width: 30 },
                    { cellRendererFramework: MarkerQuality, width: 30 }
                ]
            }

            if (this.documentType === 'xreport') {
                let fields = constants.objectDefinitions.xreport.fields
                this.columnDefs = [
                    getColDef(this, fields.title, DocumentLink),
                    getColDef(this, fields.date),
                    getColDef(this, fields.nb_impacted),
                    getColDef(this, fields.severity),
                    getColDef(this, fields.activities),
                    getColDef(this, fields.event_type)
                ]
            }

            if (this.documentType === 'route') {
                let fields = constants.objectDefinitions.route.fields
                this.columnDefs = [
                    getColDef(this, fields.title, DocumentLink),
                    getColDef(this, fields.activities),
                    // { TODO
                    //
                    //     sortingAlgorithm : areaSortingAlgorithm,
                    //     width: '15%',
                    //     cellTemplate:'<area-link class="ui-grid-cell-contents" area="row.entity.areas[row.entity.areas.length-1]"></area-link>',
                    // },
                    getColDef(this, fields.orientations),

                    {
                        headerName: this.$gettext('elevation'),
                        children: [
                            getColDef(this, fields.elevation_max, undefined, { columnGroupShow: 'closed' }),
                            getColDef(this, fields.elevation_max, undefined, { columnGroupShow: 'open' }),
                            getColDef(this, fields.height_diff_up, undefined, { columnGroupShow: 'open' }),
                            getColDef(this, fields.height_diff_difficulties, undefined, { columnGroupShow: 'open' })
                        ]
                    },

                    { headerName: this.$gettext('ratings'), cellRendererFramework: RouteRating },

                    // getColDef(this, fields.quality, visible: false ),
                    // getColDef(this, fields.engagement_rating, visible: false ),
                    // getColDef(this, fields.equipment_rating, visible: false ),
                    // getColDef(this, fields.exposition_rock_rating, visible: false ),
                    // getColDef(this, fields.global_rating, visible: false ),
                    // getColDef(this, fields.aid_rating, visible: false ),
                    // getColDef(this, fields.risk_rating, visible: false ),
                    // getColDef(this, fields.rock_free_rating, visible: false ),
                    // getColDef(this, fields.rock_required_rating, visible: false ),

                    { cellRendererFramework: MarkerGpsTrace, width: '2rem' }
                ]
            }

            if (this.documentType === 'waypoint') {
                let fields = constants.objectDefinitions.waypoint.fields
                this.columnDefs = [
                    getColDef(this, fields.title, DocumentLink),
                    // TODO getColDef(this, fields.areas,
                    //     sortingAlgorithm : areasSortingAlgorithm,
                    // ),
                    getColDef(this, fields.elevation),
                    getColDef(this, fields.waypoint_type)
                ]
            }
        }
    }
</script>

<style src="ag-grid-community/dist/styles/ag-grid.css" />
<style src="ag-grid-community/dist/styles/ag-theme-balham.css" />
