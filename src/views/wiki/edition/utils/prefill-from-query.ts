// A new document filled from the url of its form, field by field, each given by its name:
//
//   /outings/add/fr?r=1000819&act=skitouring&date_start=2026-11-26&height_diff_up=930&title=Pointe%20de%20la%20Galise
//
// A value is parsed as its field's type and checked against its values and its limits. A value that does not fit is
// ignored, as if it was not given: the form opens anyway, and the user fills that field in. The associations (?r=,
// ?w=…) and ?act= are read by document-edition.ts.
//
// The track of an outing is given in the fragment instead, percent-encoded: #geom=<the text of a GPS file>. The
// fragment never reaches the server, which refuses a query string over 8 KB, when a track of a few hours is tens of KB
import type { LocationQuery } from 'vue-router';

import type Field from '@/js/constants/Field';
import type { C2cDocument } from '@/js/vue-plugins/document-utils';

// not a value of the document itself: its associations, a filter of the lists, the conditions per level
const SKIPPED_TYPES = ['document', 'dates', 'Array'];
// the language is the one of the form's url
const SKIPPED_FIELDS = ['lang'];
const DATE = /^\d{4}-\d{2}-\d{2}$/;

export function prefillFromQuery(document: C2cDocument, fields: Record<string, Field>, query: LocationQuery) {
  for (const field of Object.values(fields)) {
    const text = queryText(query, field.name);
    if (text === undefined || SKIPPED_FIELDS.includes(field.name)) {
      continue;
    }

    const value = parseQueryValue(field, text);
    if (value === undefined) {
      continue;
    }

    if (field.parent === 'document') {
      document[field.name] = value;
    } else if (field.parent === 'locales' && document.locales?.[0]) {
      (document.locales[0] as Record<string, unknown>)[field.name] = value;
    }
  }
}

/** The value of a field from the text of its query parameter, or undefined when it does not fit the field */
export function parseQueryValue(field: Field, text: string): unknown {
  if (SKIPPED_TYPES.includes(field.type)) {
    return undefined;
  }

  const allowed = field.values;
  if (allowed) {
    const values = field.multiple ? text.split(',') : [text];
    if (!values.every((value) => allowed.includes(value))) {
      return undefined;
    }
    return field.multiple ? values : text;
  }

  switch (field.type) {
    case 'number':
      return parseNumber(field, text);
    case 'date':
      return DATE.test(text) && !Number.isNaN(Date.parse(text)) ? text : undefined;
    case 'boolean':
      return { true: true, false: false }[text];
    default:
      return text;
  }
}

function parseNumber(field: Field, text: string) {
  const number = Number(text);
  if (!Number.isFinite(number)) {
    return undefined;
  }
  if ((field.min !== undefined && number < field.min) || (field.max !== undefined && number > field.max)) {
    return undefined;
  }
  return number;
}

/** The track given in the fragment of the form's url (#geom=…): the text of a GPS file, or null without one */
export function trackFromHash(hash: string | undefined): string | null {
  if (!hash) {
    return null;
  }
  const track = new URLSearchParams(hash.replace(/^#/, '')).get('geom');
  return track === null || track === '' ? null : track;
}

// a parameter given twice keeps its first value; an empty one is not given
function queryText(query: LocationQuery, name: string) {
  const value = query[name];
  const text = Array.isArray(value) ? value[0] : value;
  return typeof text === 'string' && text !== '' ? text : undefined;
}
