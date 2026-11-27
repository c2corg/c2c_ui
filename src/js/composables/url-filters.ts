// The filters of a documents list in the URL: its document type, activities and waypoint types, and the fields shown
import { computed } from 'vue';
import { useRoute } from 'vue-router';

import constants from '@/js/constants';
import type Field from '@/js/constants/Field';

export function useUrlFilters() {
  const route = useRoute();

  const urlWaypointTypes = computed(() => String(route.query.wtyp ?? '').split(','));
  const urlActivities = computed(() => String(route.query.act ?? '').split(','));

  const documentType = computed(() => {
    const name = String(route.name);
    // the itinevert pages: the document type is in the query
    if (name.startsWith('itinevert')) {
      return String(route.query.documentType ?? 'route');
    }
    // route names are the document type with a tail "s" (outings, routes...), or with a suffix (outings-stats)
    return name.split('-')[0].slice(0, -1);
  });

  const fields = computed(() => constants.objectDefinitions[documentType.value].fields);

  function fieldIsVisible(field: Field): boolean {
    return documentType.value === 'waypoint'
      ? field.isVisibleForWaypointTypes(urlWaypointTypes.value)
      : field.isVisibleForActivities(urlActivities.value);
  }

  return { urlWaypointTypes, urlActivities, documentType, fields, fieldIsVisible };
}
