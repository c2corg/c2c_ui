/*
 * The quality ("complétude") computed for the personal documents: outings, personal articles and images.
 *
 * It is computed when the document is saved (views/wiki/edition/utils/QualityField.vue), and for an outing again
 * when images are added to it (refreshOutingQuality() in components/images-uploader/ImagesUploader.vue).
 *
 * The outings with an "empty" quality are not listed on the pages of their routes (RecentOutingsBox.vue): an
 * outing with any text is never "empty".
 */

import type { C2cDocument } from '@/js/vue-plugins/document-utils';

type Doc = C2cDocument;
// a locale of the document, with the fields of its document type
type Locale = Record<string, unknown>;

export type Quality = 'empty' | 'draft' | 'medium' | 'fine' | 'great';

function getQualityFromScore(score: number): Quality {
  if (score < 1) {
    return 'empty';
  } else if (score < 2) {
    return 'draft';
  } else if (score < 3) {
    return 'medium';
  }
  return 'fine'; // never compute great
}

function hasActivities(doc: Doc, activities: string[]) {
  return activities.some((activity) => doc.activities?.includes(activity));
}

// a text field written in, a few words being enough: "plan an Abalakov" is precious
function hasText(locale: Locale, field: string) {
  const value = locale[field];
  return typeof value === 'string' && value.trim() !== '';
}

// the text fields of the locale of an outing (title and participants are not about the outing itself)
const OUTING_TEXT_FIELDS = [
  'summary',
  'description',
  'route_description',
  'conditions',
  'access_comment',
  'hut_comment',
  'avalanches',
  'weather',
  'timing',
];

function hasAnyText(locale: Locale) {
  return OUTING_TEXT_FIELDS.some((field) => hasText(locale, field));
}

function hasTrack(doc: Doc) {
  return Boolean(doc.geometry?.geom_detail);
}

function hasImages(doc: Doc) {
  return Boolean(doc.associations?.images?.length);
}

function hasConditionLevel(locale: Locale) {
  if (hasText(locale, 'conditions')) {
    return true;
  }

  if (typeof locale.conditions_levels !== 'string' || !locale.conditions_levels) {
    return false;
  }

  const levels = JSON.parse(locale.conditions_levels);

  if (levels && levels.length !== 0) {
    if (
      levels[0].level_place ||
      levels[0].level_comment ||
      levels[0].level_snow_height_total ||
      levels[0].level_snow_height_soft
    ) {
      return true;
    }
  }

  return false;
}

function hasSnowInfo(doc: Doc) {
  return (
    doc.elevation_up_snow ||
    doc.elevation_down_snow ||
    doc.snow_quantity ||
    doc.snow_quality ||
    doc.length_total ||
    doc.glacier_rating
  );
}

// what describes the itinerary that was followed, and what shows it: the same for all the activities
function getRouteScore(doc: Doc, locale: Locale) {
  let score = 0;

  score += hasText(locale, 'route_description') ? 0.5 : 0;
  score += hasTrack(doc) ? 0.5 : 0;
  score += hasImages(doc) ? 0.5 : 0;

  return score;
}

// Above "medium", each activity needs the information that matters most for it (the "key" information):
//  - ski and snowshoe: the snow conditions, by altitude;
//  - mountaineering and ice: the conditions;
//  - rock climbing, via ferrata, slackline, hiking and mountain bike: the conditions, or a personal comment: the
//    equipment, the rock, the trail are often described in it;
//  - paragliding: the conditions, the weather (the wind), or a personal comment.

// ski touring and snowshoeing
function getSnowScore(doc: Doc, locale: Locale) {
  let score = getRouteScore(doc, locale);

  score += hasSnowInfo(doc) ? 0.5 : 0;

  if (
    (doc.access_condition && doc.access_condition !== 'snowy' && doc.elevation_access) ||
    (doc.access_condition === 'snowy' && doc.elevation_access && hasText(locale, 'access_comment'))
  ) {
    score += 0.5;
  }

  // the avalanche signs are a list: ['no'] when none was seen
  score += doc.avalanche_signs?.some((sign) => sign !== 'no') && hasText(locale, 'avalanches') ? 0.5 : 0;

  score += hasText(locale, 'description') ? 0.5 : 0;
  score += hasText(locale, 'weather') ? 0.5 : 0;
  score += doc.condition_rating ? 0.5 : 0;

  return hasConditionLevel(locale) ? score + 1 : Math.min(score, 2);
}

// snow, ice and mixed, ice climbing and mountaineering
function getIceScore(doc: Doc, locale: Locale) {
  let score = getRouteScore(doc, locale);

  score += doc.condition_rating ? 0.5 : 0;
  score += hasText(locale, 'description') ? 1 : 0;
  score += hasText(locale, 'timing') ? 0.5 : 0;
  score += hasText(locale, 'weather') ? 0.5 : 0;

  return hasConditionLevel(locale) ? score + 1.5 : Math.min(score, 2);
}

// rock climbing, via ferrata, slacklining, hiking and mountain biking
function getClimbingScore(doc: Doc, locale: Locale) {
  let score = getRouteScore(doc, locale);

  score += hasText(locale, 'conditions') ? 1 : 0;
  score += hasText(locale, 'description') ? 1 : 0;
  score += hasText(locale, 'timing') ? 0.5 : 0;
  score += hasText(locale, 'weather') ? 0.5 : 0;

  const hasKeyInformation = hasText(locale, 'conditions') || hasText(locale, 'description');
  return hasKeyInformation ? score : Math.min(score, 2);
}

// paragliding: the weather is the condition that matters
function getParaglidingScore(doc: Doc, locale: Locale) {
  let score = getRouteScore(doc, locale);

  score += hasText(locale, 'conditions') ? 1 : 0;
  score += hasText(locale, 'description') ? 1 : 0;
  score += hasText(locale, 'weather') ? 1 : 0;
  score += hasText(locale, 'timing') ? 0.5 : 0;

  const hasKeyInformation =
    hasText(locale, 'conditions') || hasText(locale, 'weather') || hasText(locale, 'description');
  return hasKeyInformation ? score : Math.min(score, 2);
}

const OUTING_SCORES: [string[], (doc: Doc, locale: Locale) => number][] = [
  [['skitouring', 'snowshoeing'], getSnowScore],
  [['snow_ice_mixed', 'ice_climbing', 'mountain_climbing'], getIceScore],
  [['rock_climbing', 'via_ferrata', 'slacklining', 'hiking', 'mountain_biking'], getClimbingScore],
  [['paragliding'], getParaglidingScore],
];

export function getOutingQuality(doc: Doc, locale: Locale): Quality {
  // an outing of several activities: the best of them
  let score = Math.max(
    0,
    ...OUTING_SCORES.filter(([activities]) => hasActivities(doc, activities)).map(([, getScore]) =>
      getScore(doc, locale)
    )
  );

  if (hasAnyText(locale)) {
    // something was written: it is not empty, and it is listed with the outings of its route
    score = Math.max(score, 1);
  }

  return getQualityFromScore(score);
}

function getImageQuality(doc: Doc, locale: Locale) {
  let score = 0;

  score += doc.geometry && doc.geometry.geom ? 1 : 0;
  score += doc.activities && doc.activities.length ? 0.5 : 0;
  score += doc.categories && doc.categories.length ? 0.5 : 0;
  score += doc.associations!.waypoints?.length || doc.associations!.routes?.length ? 1 : 0;

  score += locale.title ? 1 : 0;
  score += locale.description ? 1 : 0;

  return getQualityFromScore(score);
}

function getArticleQuality(doc: Doc, locale: Locale) {
  const description = typeof locale.description === 'string' ? locale.description : '';

  let score = 0;

  score += doc.associations!.waypoints?.length ? 1 : 0;
  score += doc.associations!.images?.length ? 1 : 0;
  score += locale.summary ? 1 : 0;
  score += description ? 1 : -1;
  score += description.search(/(^|\n)##/g) !== -1 ? 1 : 0; // title
  score += description.search(/\[img=/g) !== -1 ? 1 : 0; // img

  return getQualityFromScore(score);
}

/**
 * The quality computed for a document in one of its locales, or its own quality when it is not computed: for the
 * collaborative documents, and for a "great" document (never computed: it was chosen).
 */
export function computeQuality(doc: Doc, locale: Locale): string {
  if (doc.quality === 'great') {
    return 'great';
  }

  if (doc.type === 'o') {
    return getOutingQuality(doc, locale);
  } else if (doc.type === 'c') {
    return getArticleQuality(doc, locale);
  } else if (doc.type === 'i') {
    return getImageQuality(doc, locale);
  }

  return doc.quality as string;
}
