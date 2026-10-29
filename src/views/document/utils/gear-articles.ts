// The articles about the gear a route needs, shown on its page: their labels by article id
import type { C2cDocument } from '@/js/vue-plugins/document-utils';

export function getGearArticles(doc: C2cDocument, $gettext: (text: string) => string): Record<string, string> {
  const result: Record<string, string> = {};
  const activities = doc.activities ?? [];
  const easy_mountain = ['F', 'F+', 'PD-', 'PD', 'PD+', 'AD-', 'AD'];
  const poor_equiped = ['P2', 'P2+', 'P3', 'P3+', 'P4'];
  const glacier_activities = ['mountain_climbing', 'skitouring', 'snow_ice_mixed', 'snowshoeing'];

  if (activities.includes('snowshoeing') || activities.includes('skitouring')) {
    result['183333'] = $gettext('Skitouring gear');
  }

  if (activities.includes('snow_ice_mixed') && ['F', 'F+', 'PD-', 'PD', 'PD+'].includes(doc.global_rating)) {
    result['185750'] = $gettext('Easy snow ice mixed gear');
  }

  if (activities.includes('mountain_climbing') && easy_mountain.includes(doc.global_rating)) {
    result['185384'] = $gettext('Easy mountain climbing gear');
  }

  if (activities.includes('rock_climbing')) {
    if (['bloc', 'psicobloc'].includes(doc.climbing_outdoor_type)) {
      result['1516488'] = $gettext('Bouldering climbing gear');
    } else if (doc.climbing_outdoor_type === 'single') {
      result['1307778'] = $gettext('Crag climbing gear');
    } else if (['P1', 'P1+'].includes(doc.equipment_rating)) {
      result['183332'] = $gettext('Bolted rock climbing gear');
    } else if (
      !activities.includes('mountain_climbing') &&
      easy_mountain.includes(doc.global_rating) &&
      poor_equiped.includes(doc.equipment_rating)
    ) {
      result['185384'] = $gettext('Easy mountain climbing gear');
    }
  }

  if (activities.includes('ice_climbing')) {
    result['194479'] = $gettext('Ice and dry climbing gear');
  }

  if (activities.includes('hiking')) {
    result['185207'] = $gettext('Hiking gear');
  }

  // we should use an anchor for glacier gear, but it's not possible
  if (doc.glacier_gear && doc.glacier_gear !== 'no') {
    if (activities.some((act: string) => glacier_activities.includes(act))) {
      result['185750'] = $gettext('Easy snow ice mixed gear');
    }
  }

  return result;
}
