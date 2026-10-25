import common from './common.json';
import fieldsPropertiesJson from './fieldsProperties.json';

import utils from '@/js/utils';

export type QueryMode =
  | 'numericalRangeSlider'
  | 'valuesRangeSlider'
  | 'multiSelect'
  | 'orientations'
  | 'checkbox'
  | 'tristate'
  | 'input'
  | 'activities'
  | 'input-document'
  | 'date'
  | 'dates';

export type FieldParent = 'document' | 'locales' | 'associations';

// the properties of a field: fieldsProperties.json, overridden per document type by documentsProperties.json
export type FieldProperties = {
  type?: string;
  parent?: FieldParent;
  // the possible values; in the JSON, the name of a common attribute giving them
  values?: string[] | string;
  i18nContext?: string;
  i18n?: boolean;
  multiple?: boolean;
  required?: boolean;
  nullable?: boolean;
  default?: boolean | string;
  disabled?: boolean;
  queryMode?: QueryMode;
  url?: string | null;
  helper?: string | null;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  minLengthChinese?: number;
  sortable?: boolean;
  unit?: string;
  units?: string;
  skipSpaceBeforeUnit?: boolean;
  prefix?: string;
  // for document fields (associations): the type of the documents
  documentType?: string;
  // the activities and waypoint types the field is shown for
  activities?: string[];
  waypoint_types?: string[];
  associationEditorOrder?: number;
  name?: string;
};

// a document, as far as the fields go
export type FieldDocument = {
  type?: string;
  activities?: string[];
  waypoint_type?: string;
  climbing_outdoor_type?: string;
  associations?: Record<string, unknown>;
  [property: string]: unknown;
};

type FieldError = { name: string | undefined; description: string };

const attrs = common.attributes as Record<string, string[]>;
const fieldsProperties = fieldsPropertiesJson as Record<string, FieldProperties>;

// values can be a string : it describes a common.attributes fields
for (const property of Object.values(fieldsProperties)) {
  if (property.values && typeof property.values === 'string') {
    property.i18nContext = property.values;
    property.values = attrs[property.values];
  }
}

const onlyRockClimbing = function (document: FieldDocument) {
  const activities = document.activities;

  if (!activities || activities.length === 0 || activities.length > 1) {
    return false;
  }

  return activities[0] === 'rock_climbing';
};

// this handler is only for routes
const getIsOnlyRockClimbingTypesHandler = function (types: string[]) {
  return function (document: FieldDocument) {
    if (document.type !== 'r') {
      return true;
    }

    if (onlyRockClimbing(document) && !types.includes(document.climbing_outdoor_type ?? '')) {
      return false;
    }

    // generic activities criterion is handle by documentProperties.json
    return true;
  };
};

const extraIsVisibleForHandlers: Record<string, (document: FieldDocument) => boolean> = {
  route_types(document) {
    if (!document.activities || document.activities.length === 0) {
      return false;
    }

    if (document.activities.length > 1) {
      return true;
    }

    if (onlyRockClimbing(document) && !['single', 'multi'].includes(document.climbing_outdoor_type ?? '')) {
      return false;
    }

    return true;
  },

  configuration: getIsOnlyRockClimbingTypesHandler(['multi']),
  global_rating: getIsOnlyRockClimbingTypesHandler(['multi']),
  engagement_rating: getIsOnlyRockClimbingTypesHandler(['multi']),

  equipment_rating: getIsOnlyRockClimbingTypesHandler(['single', 'multi']),
  rock_required_rating: getIsOnlyRockClimbingTypesHandler(['single', 'multi']),
  aid_rating: getIsOnlyRockClimbingTypesHandler(['single', 'multi']),
};

export default class Field {
  name: string;
  error: unknown = null;
  // the properties of the JSON files, copied by the constructor
  declare type: string;
  declare parent: FieldParent;
  declare values?: string[];
  declare i18nContext?: string;
  declare i18n: boolean;
  declare multiple?: boolean;
  declare required?: boolean;
  declare nullable?: boolean;
  declare default?: boolean | string;
  declare disabled?: boolean;
  declare queryMode?: QueryMode;
  declare url?: string | null;
  declare helper?: string | null;
  declare min?: number;
  declare max?: number;
  declare minLength?: number;
  declare maxLength?: number;
  declare minLengthChinese?: number;
  declare sortable?: boolean;
  declare unit?: string;
  declare units?: string;
  declare skipSpaceBeforeUnit?: boolean;
  declare prefix?: string;
  declare documentType?: string;
  declare activities?: string[];
  declare waypoint_types?: string[];
  declare associationEditorOrder?: number;
  defaultUrlQuery?: string | number;
  extraIsVisibleFor: (document: FieldDocument) => boolean;

  constructor(id: string, properties: FieldProperties = {}) {
    this.name = id;
    this.error = null;

    // copy baseProperties to this, and overwrite it with specific properties
    Object.assign(this, fieldsProperties[id], properties);

    this.parent = this.parent ?? 'document';
    this.type = this.type ?? 'text';

    this.extraIsVisibleFor = extraIsVisibleForHandlers[this.name] || Boolean; // trick for true default

    // Does the values can be translated
    if (this.i18n === undefined) {
      this.i18n = Boolean(this.type === 'text' || this.values);
    }

    if (this.queryMode === undefined) {
      if (this.type === 'number') {
        this.queryMode = 'numericalRangeSlider';
      } else if (this.type === 'boolean') {
        // console.assert(this.nullable || this.default !== undefined, `${this.name} must be nullable, or have a default value`);
        this.queryMode = this.nullable ? 'tristate' : 'checkbox';
      } else if (this.type === 'document') {
        this.queryMode = 'input-document';
      } else if (this.values) {
        this.queryMode = 'multiSelect';
      }
    }

    if (this.defaultUrlQuery === undefined) {
      if (this.queryMode === 'numericalRangeSlider') {
        this.defaultUrlQuery = [this.min, this.max].join(',');
      } else if (this.queryMode === 'valuesRangeSlider') {
        const values = this.values ?? [];
        this.defaultUrlQuery = [values[0], values[values.length - 1]].join(',');
      } else if (this.queryMode === 'multiSelect' || this.queryMode === 'orientations') {
        this.defaultUrlQuery = '';
      } else if (this.queryMode === 'checkbox') {
        this.defaultUrlQuery = 'false';
      } else if (this.queryMode === 'tristate') {
        this.defaultUrlQuery = '';
      } else if (this.queryMode === 'input') {
        this.defaultUrlQuery = { number: 0, text: '' }[this.type];
      } else if (this.queryMode === 'activities') {
        this.defaultUrlQuery = '';
      } else if (this.queryMode === 'input-document') {
        this.defaultUrlQuery = '';
      } else if (this.queryMode === 'date' || this.queryMode === 'dates') {
        this.defaultUrlQuery = '';
      } else if (this.url !== undefined) {
        throw new Error('Unknow field queryMode for ' + this.name + ': ' + this.queryMode);
      }
    }
  }

  // the value of the field as an URL query parameter: the list of values for ranges and multiple values
  valueToUrl(value: unknown): unknown {
    if (this.queryMode === 'numericalRangeSlider' || this.queryMode === 'valuesRangeSlider') {
      return (value as unknown[]).join(',');
    }

    if (this.queryMode === 'multiSelect' || this.queryMode === 'orientations' || this.queryMode === 'activities') {
      return (value as unknown[]).join(',');
    }

    if (this.queryMode === 'checkbox') {
      return JSON.stringify(value);
    }

    if (this.queryMode === 'tristate') {
      if (value === 'no info') {
        return 'null';
      } else if (value === 'yes') {
        return 'true';
      } else if (value === 'no') {
        return 'false';
      } else {
        return '';
      }
    }

    if (this.queryMode === 'input') {
      return value;
    }

    if (this.queryMode === 'input-document') {
      return (value as unknown[]).join(',');
    }

    throw new Error('Unknow field queryMode for ' + this.name + ': ' + this.queryMode);
  }

  // the value of the field from an URL query parameter (a string, or a boolean or null for tristate fields)
  urlToValue(url: unknown): unknown {
    if (this.queryMode === 'numericalRangeSlider') {
      const value = String(url ?? this.defaultUrlQuery).split(',');
      return [parseInt(value[0]), parseInt(value[1])];
    }

    if (this.queryMode === 'valuesRangeSlider') {
      return String(url ?? this.defaultUrlQuery).split(',');
    }

    if (this.queryMode === 'multiSelect' || this.queryMode === 'orientations' || this.queryMode === 'activities') {
      if (!url) {
        return this.defaultUrlQuery === '' ? [] : String(this.defaultUrlQuery).split(',');
      }

      return String(url).split(',');
    }

    if (this.queryMode === 'tristate') {
      if (url === 'true' || url === true) {
        return 'yes';
      } else if (url === 'false' || url === false) {
        return 'no';
      } else if (url === 'null' || url === null) {
        return 'no info';
      } else {
        return undefined;
      }
    }

    if (this.queryMode === 'checkbox') {
      return !(url === null || url === undefined || url === '' || url === 'false');
    }

    if (this.queryMode === 'input') {
      const value = url || this.defaultUrlQuery;

      if (this.type === 'number') {
        return parseInt(String(value));
      }

      if (this.type === 'text') {
        return value;
      }

      throw new Error(`Unknow field type for ${this.name} : ${this.type}`);
    }

    if (this.queryMode === 'input-document') {
      return url
        ? String(url)
            .split(',')
            .map((num) => parseInt(num, 10))
        : [];
    }

    throw new Error('Unknow field queryMode for ' + this.name + ': ' + this.queryMode);
  }

  getErrorObject(description: string): FieldError {
    let errorName;

    if (this.parent === 'document') {
      errorName = this.name;
    } else if (this.parent === 'locales') {
      errorName = `locales.0.${this.name}`;
    } else if (this.parent === 'associations') {
      errorName = `associations.${this.name}`;
    }

    return {
      name: errorName,
      description,
    };
  }

  getError(document: FieldDocument, locale: Record<string, unknown>): FieldError | null {
    if (!this.isVisibleFor(document)) {
      return null;
    }

    // a text, or a list for multiple values and associations
    let value: string | unknown[] | undefined;

    if (this.parent === 'document') {
      value = document[this.name] as typeof value;
    } else if (this.parent === 'locales') {
      value = locale[this.name] as typeof value;
    } else if (this.parent === 'associations') {
      value = document.associations?.[this.name] as typeof value;
    } else {
      throw new Error(`Unexpected parent property : ${this.parent}`);
    }

    if (
      value &&
      this.minLength &&
      value.length < this.minLength &&
      (!this.minLengthChinese || !String(value).match(/[\u3400-\u9FFF]/) || value.length < this.minLengthChinese)
    ) {
      return this.getErrorObject('This field is too short');
    }

    if (value && this.maxLength && value.length > this.maxLength) {
      return this.getErrorObject('This field is too long');
    }

    /* check presence */
    if (this.required && (!value || (this.multiple && value.length === 0))) {
      return this.getErrorObject(`required field`);
    }

    return null;
  }

  isVisibleForActivities(activities?: string[]): boolean {
    let result = true;

    if (this.activities && activities) {
      result = utils.intersectionIsNotNull(this.activities, activities);
    }

    return result;
  }

  isVisibleForWaypointType(waypointType?: string): boolean {
    if (!this.waypoint_types) {
      return true;
    }

    if (!waypointType) {
      return false;
    }

    return this.waypoint_types.includes(waypointType);
  }

  isVisibleForWaypointTypes(waypointTypes?: string[]): boolean {
    if (!this.waypoint_types) {
      return true;
    }

    if (!waypointTypes) {
      return false;
    }

    return utils.intersectionIsNotNull(this.waypoint_types, waypointTypes);
  }

  isVisibleFor(document: FieldDocument): boolean {
    if (!this.extraIsVisibleFor(document)) {
      return false;
    }

    if (!this.isVisibleForActivities(document.activities)) {
      return false;
    }

    if (!this.isVisibleForWaypointType(document.waypoint_type)) {
      return false;
    }

    return true;
  }
}
