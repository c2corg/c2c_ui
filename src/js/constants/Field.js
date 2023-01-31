import common from './common.json';
import fieldsProperties from './fieldsProperties.json';

import utils from '@/js/utils';

const attrs = common.attributes;

// values can be a string : it describes a common.attributes fields
for (const property of Object.values(fieldsProperties)) {
  if (property.values && typeof property.values === 'string') {
    property.i18nContext = property.values;
    property.values = attrs[property.values];
  }
}

const onlyRockClimbing = function (document) {
  const activities = document.activities;

  if (!activities || activities.length === 0 || activities.length > 1) {
    return false;
  }

  return activities[0] === 'rock_climbing';
};

// this handler is only for routes
const getIsOnlyRockClimbingTypesHandler = function (types) {
  return function (document) {
    if (document.type !== 'r') {
      return true;
    }

    if (onlyRockClimbing(document) && !types.includes(document.climbing_outdoor_type)) {
      return false;
    }

    // generic activities criterion is handle by documentProperties.json
    return true;
  };
};

const extraIsVisibleForHandlers = {
  route_types(document) {
    if (!document.activities || document.activities.length === 0) {
      return false;
    }

    if (document.activities.length > 1) {
      return true;
    }

    if (onlyRockClimbing(document) && !['single', 'multi'].includes(document.climbing_outdoor_type)) {
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

function Field(id, properties = {}) {
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
      this.defaultUrlQuery = [this.values[0], this.values[this.values.length - 1]].join(',');
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

Field.prototype.valueToUrl = function (value) {
  if (this.queryMode === 'numericalRangeSlider' || this.queryMode === 'valuesRangeSlider') {
    return value.join(',');
  }

  if (this.queryMode === 'multiSelect' || this.queryMode === 'orientations' || this.queryMode === 'activities') {
    return value.join(',');
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
    return value.join(',');
  }

  throw new Error('Unknow field queryMode for ' + this.name + ': ' + this.queryMode);
};

Field.prototype.urlToValue = function (url) {
  if (this.queryMode === 'numericalRangeSlider') {
    let value = url ?? this.defaultUrlQuery;
    value = value.split(',');
    return [parseInt(value[0]), parseInt(value[1])];
  }

  if (this.queryMode === 'valuesRangeSlider') {
    const value = url ?? this.defaultUrlQuery;
    return value.split(',');
  }

  if (this.queryMode === 'multiSelect' || this.queryMode === 'orientations' || this.queryMode === 'activities') {
    if (!url) {
      return this.defaultUrlQuery === '' ? [] : this.defaultUrlQuery.split(',');
    }

    return url.split(',');
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
      return parseInt(value);
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
};

Field.prototype.getErrorObject = function (description) {
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
};

Field.prototype.getError = function (document, locale) {
  if (!this.isVisibleFor(document)) {
    return null;
  }

  let value;

  if (this.parent === 'document') {
    value = document[this.name];
  } else if (this.parent === 'locales') {
    value = locale[this.name];
  } else if (this.parent === 'associations') {
    value = document.associations[this.name];
  } else {
    throw new Error(`Unexpected parent property : ${this.parent}`);
  }

  if (
    value &&
    this.minLength &&
    value.length < this.minLength &&
    (!this.minLengthChinese || !value.match(/[\u3400-\u9FFF]/) || value.length < this.minLengthChinese)
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
};

Field.prototype.isVisibleForActivities = function (activities) {
  let result = true;

  if (this.activities && activities) {
    result = utils.intersectionIsNotNull(this.activities, activities);
  }

  return result;
};

Field.prototype.isVisibleForWaypointType = function (waypointType) {
  if (!this.waypoint_types) {
    return true;
  }

  if (!waypointType) {
    return false;
  }

  return this.waypoint_types.includes(waypointType);
};

Field.prototype.isVisibleForWaypointTypes = function (waypointTypes) {
  if (!this.waypoint_types) {
    return true;
  }

  if (!waypointTypes) {
    return false;
  }

  return utils.intersectionIsNotNull(this.waypoint_types, waypointTypes);
};

Field.prototype.isVisibleFor = function (document) {
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
};

export default Field;
