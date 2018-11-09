
import constants from "@/js/constants"

const result = { }

// https://gitlab.com/cbeauchesne/campui/blob/master/app/static/campui/js/factories/factories.js#L354

let fields


fields = constants.objectDefinitions.area.fields
result.area = [
    { field: fields.title, componentName:'document-link' },
    { field: fields.area_type},
]

fields = constants.objectDefinitions.article.fields
result.article = [
    {field: fields.title, componentName:'document-link' },
    {field: fields.quality },
    {field: fields.activities },
    {field: fields.categories },
    {field: fields.article_type },
    {field: fields.quality },
]

fields = constants.objectDefinitions.outing.fields
result.outing = [
    { field: fields.title, componentName:'document-link' },
    { field: fields.activities },
    { field: fields.date_start, class:"is-nowrap" },
    // TODO { field: fields.areas },
    { field: fields.condition_rating },
    { field: fields.height_diff_up },
    // TODO { field: fields.author },
]

fields = constants.objectDefinitions.xreport.fields
result.xreport = [
    { field: fields.title, componentName:'document-link' },
    { field: fields.date },
    { field: fields.nb_impacted },
    { field: fields.severity },
    { field: fields.activities },
    { field: fields.event_type },
]

fields = constants.objectDefinitions.route.fields
result.route = [
    { field: fields.title, componentName:'document-link' },
    { field: fields.activities, width:"10%" },
    // { TODO
    //
    //     sortingAlgorithm : areaSortingAlgorithm,
    //     width: '15%',
    //     cellTemplate:'<area-link class="ui-grid-cell-contents" area="row.entity.areas[row.entity.areas.length-1]"></area-link>',
    // },
    // { TODO field: fields.global_rating,
    //     width: '15%',
    //     cellTemplate:'<rating route="row.entity" class="ui-grid-cell-contents"/>',
    // },
    { field: fields.height_diff_difficulties, width:"10%" },
    { field: fields.orientations, width:"10%" },
    { field: fields.aid_rating, visible:false },
    { field: fields.elevation_max, visible:false },
    { field: fields.engagement_rating, visible:false },
    { field: fields.equipment_rating, visible:false },
    { field: fields.exposition_rock_rating, visible:false },
    { field: fields.global_rating, width:"10%" },
    { field: fields.height_diff_up, visible:false },
    // TODO { field: fields.protected, visible:false },
    { field: fields.quality, visible:false },
    { field: fields.risk_rating, visible:false },
    { field: fields.rock_free_rating, visible:false },
    { field: fields.rock_required_rating, visible:false },
    // TODO { field: fields.document_id, header: 'id', visible:false },
]

fields = constants.objectDefinitions.waypoint.fields
result.waypoint = [
    { field: fields.title, componentName:'document-link' },
    // TODO { field: fields.areas,
    //     sortingAlgorithm : areasSortingAlgorithm,
    // },
    { field: fields.elevation, width: '10%' },
    { field: fields.waypoint_type, width: '15%' },
]

export default result
