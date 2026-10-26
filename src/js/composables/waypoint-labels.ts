// Waypoint fields access and access_period have a different signification, depending of waypoint_type
// It implies different label/titles/placeholders. And this logic is needed in both document views and
// edition views.
//
// Placeholders are needed only in edition views, but it's better to keep all this logic on the same place
import { computed, getCurrentInstance } from 'vue';

export function useWaypointLabels(getDocument: () => { waypoint_type?: string } | null | undefined) {
  const { $gettext } = getCurrentInstance()!.appContext.config.globalProperties;

  return {
    descriptionTitle: computed(() => {
      return getDocument()?.waypoint_type === 'access' ? $gettext('road access') : $gettext('description');
    }),

    accessTitle: computed(() => {
      const document = getDocument();
      if (!document) {
        return '';
      }

      switch (document.waypoint_type) {
        case 'access':
          return $gettext('public transportation access');
        case 'climbing_outdoor':
          return $gettext('pedestrian access');
        case 'hut':
          return $gettext('pedestrian access', 'hut');
        default:
          return $gettext('road or pedestrian access');
      }
    }),

    accessPeriodTitle: computed(() => {
      const document = getDocument();
      if (!document) {
        return '';
      }

      switch (document.waypoint_type) {
        case 'hut':
        case 'gite':
        case 'camp_site':
          return $gettext('opening_periods');
        case 'local_product':
          return $gettext('opening_hours');
        case 'climbing_outdoor':
          return $gettext('restricted_access');
        default:
          return $gettext('access_period');
      }
    }),

    descriptionPlaceholder: computed(() => {
      const type = getDocument()?.waypoint_type;
      switch (type) {
        case 'access':
          return $gettext('Describe road access');
        default:
          return $gettext('Describe here the waypoint');
      }
    }),

    accessPlaceholder: computed(() => {
      const type = getDocument()?.waypoint_type;
      switch (type) {
        case 'access':
          return $gettext('Describe pt access');
        case 'hut':
          return $gettext('Describe pedestrian access', 'hut');
        case 'climbing_outdoor':
          return $gettext('Describe pedestrian access');
        default:
          return $gettext('Describe access');
      }
    }),

    accessPeriodPlaceholder: computed(() => {
      const type = getDocument()?.waypoint_type;
      switch (type) {
        case 'hut':
        case 'gite':
        case 'camp_site':
          return $gettext('Describe opening periods');
        case 'local_product':
          return $gettext('Describe opening hours');
        case 'climbing_outdoor':
          return $gettext('Describe access restrictions');
        default:
          return $gettext('Describe access period');
      }
    }),
  };
}
