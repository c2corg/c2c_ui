import constants from '@/js/constants';

export default {
  computed: {
    urlWaypointTypes() {
      return (this.$route.query.wtyp ?? '').split(',');
    },

    urlActivities() {
      return (this.$route.query.act ?? '').split(',');
    },

    fields() {
      return constants.objectDefinitions[this.documentType].fields;
    },

    documentType() {
      // route name are like outings, routes ...
      // always the document type with a tail "s".
      // the `.slice(0, -1)` removes this "s"
      // it also can be outings-stats => the `.split('-')[0]` remove "-stats"

      // check if it starts with "Itinevert", so that we can retrieve the doc type
      if (this.$route.name.startsWith('Itinevert')) {
        return this.$route.query.documentType ?? 'route';
      }
      // else url starts with the doc type
      return this.$route.name.split('-')[0].slice(0, -1);
    },
  },

  methods: {
    fieldIsVisible(field) {
      if (this.documentType === 'waypoint') {
        if (field.isVisibleForWaypointTypes(this.urlWaypointTypes)) {
          return true;
        }
      } else if (field.isVisibleForActivities(this.urlActivities)) {
        return true;
      }

      return false;
    },
  },
};
