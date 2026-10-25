import Field, { type FieldProperties } from './Field';
import common from './common.json';
import documentsPropertiesJson from './documentsProperties.json';

// a document type of documentsProperties.json: its letter (the API's type), and its fields by name
export type DocumentDefinition = {
  letter: string;
  documentType: string;
  geoLocalized?: boolean;
  fields: Record<string, Field>;
};

type FieldDefinition = { id: string; properties?: FieldProperties };

const getFieldsObject = function (fieldsArray: FieldDefinition[]) {
  const result: Record<string, Field> = {};

  for (const def of fieldsArray) {
    const field = new Field(def.id, def.properties);
    result[field.name] = field;
  }

  return result;
};

// the JSON, whose field lists getFieldsObject() replaces with the fields by name
const documentsProperties = documentsPropertiesJson as unknown as Record<
  string,
  { letter: string; geoLocalized?: boolean; fields: FieldDefinition[] }
>;

class Constants {
  activities = common.attributes.activities;
  event_activities = common.attributes.event_activities;
  waypoint_types = common.attributes.waypoint_types;
  langs = common.attributes.langs;
  quality_types = common.attributes.quality_types;

  // You can find associations in https://github.com/c2corg/v6_common/blob/master/c2corg_common/associations.py

  // also, GUI avalaible associations can be found here, on dataset attribute :
  // https://github.com/c2corg/v6_ui/search?l=HTML&q=app-add-association

  documentTypes: string[] = Object.keys(documentsProperties);
  objectDefinitions: Record<string, DocumentDefinition> = {};
  letterToDocumentType: Record<string, string> = {};

  categorizedFieldsDefault: Record<string, string[]>;

  constructor() {
    for (const documentType of this.documentTypes) {
      // the object of the JSON module, its field list replaced by the fields by name, as the JavaScript version did
      const definition = Object.assign(documentsProperties[documentType], {
        fields: getFieldsObject(documentsProperties[documentType].fields),
        documentType,
      }) as unknown as DocumentDefinition;
      this.objectDefinitions[documentType] = definition;
      this.letterToDocumentType[definition.letter] = documentType;
    }

    this.categorizedFieldsDefault = {
      General: [
        'title',
        'activities',
        'article_type',
        'area_type',
        'book_types',
        'waypoint_type',
        'event_type',
        'climbing_outdoor_type',
        'route_types',
        'quality',
        'categories',
        'dates',
      ],

      ratings: [
        'global_rating',
        'rock_free_rating',
        'rock_required_rating',
        'aid_rating',
        'engagement_rating',
        'risk_rating',
        'equipment_rating',
        'exposition_rock_rating',
        'ice_rating',
        'mixed_rating',
        'ski_rating',
        'hiking_rating',
        'ski_exposition',
        'labande_global_rating',
        'labande_ski_rating',
        'snowshoe_rating',
        'via_ferrata_rating',
        'mtb_down_rating',
        'mtb_up_rating',
        'hiking_mtb_exposition',
        'glacier_rating',
        'equipment_ratings',
        'public_transportation_rating',
        'climbing_rating_max',
        'climbing_rating_median',
        'climbing_rating_min',
        'paragliding_rating',
        'snow_clearance_rating',
      ],

      Terrain: [
        'condition_rating',
        'orientations',
        'configuration',
        'elevation_max',
        'elevation_min',
        'difficulties_height',
        'height_diff_access',
        'height_diff_difficulties',
        'height_diff_down',
        'height_diff_up',
        'mtb_height_diff_portages',
        'mtb_length_asphalt',
        'mtb_length_trail',
        'rock_types',
        'slackline_type',
        'snow_quality',
        'snow_quantity',
        'avalanche_signs',
        'elevation_access',
        'elevation_down_snow',
        'elevation_up_snow',
        'children_proof',
        'prominence',
        'climbing_indoor_types',
        'climbing_outdoor_types',
        'climbing_styles',
        'elevation',
        'height_max',
        'height_median',
        'height_min',
        'length',
        'rain_proof',
        'routes_quantity',
        'length_total',
        'route_length',
        'durations',
        'glacier_gear',
      ],
      Miscs: [
        'lang',
        'frequentation',
        'public_transport',
        'lift_access',
        'access_time',
        'best_periods',
        'capacity',
        'capacity_staffed',
        'custodianship',
        'product_types',
        'public_transportation_types',
        'weather_station_types',
        'nb_participants',
        'nb_impacted',
        'severity',
        'image_type',
      ],
    };
  }
}

export default new Constants();
