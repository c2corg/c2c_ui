/*
 * Waypoint fields access and access_period have a different signification, depending of waypoint_type
 * It implies different label/titles/placeholders. And this logic is needed in both document views and
 * edition views. So we have to do a mixin for this logic
 *
 * Placeholders are needed only in edition views, but it's better to keep all thois logic on the same place
 */

export default {
  computed: {
    descriptionTitle() {
      return this.document?.waypoint_type === 'access' ? this.$gettext('road access') : this.$gettext('description');
    },

    accessTitle() {
      if (!this.document) {
        return '';
      }

      switch (this.document.waypoint_type) {
        case 'access':
          return this.$gettext('public transportation access');
        case 'climbing_outdoor':
          return this.$gettext('pedestrian access');
        case 'hut':
          return this.$gettext('pedestrian access', 'hut');
        default:
          return this.$gettext('road or pedestrian access');
      }
    },

    accessPeriodTitle() {
      if (!this.document) {
        return '';
      }

      switch (this.document.waypoint_type) {
        case 'hut':
        case 'gite':
        case 'camp_site':
          return this.$gettext('opening_periods');
        case 'local_product':
          return this.$gettext('opening_hours');
        case 'climbing_outdoor':
          return this.$gettext('restricted_access');
        default:
          return this.$gettext('access_period');
      }
    },

    descriptionPlaceholder() {
      const type = this.document?.waypoint_type;
      switch (type) {
        case 'access':
          return this.$gettext('Describe road access');
        default:
          return this.$gettext('Describe here the waypoint');
      }
    },

    accessPlaceholder() {
      const type = this.document?.waypoint_type;
      switch (type) {
        case 'access':
          return this.$gettext('Describe pt access');
        case 'hut':
          return this.$gettext('Describe pedestrian access', 'hut');
        case 'climbing_outdoor':
          return this.$gettext('Describe pedestrian access');
        default:
          return this.$gettext('Describe access');
      }
    },

    accessPeriodPlaceholder() {
      const type = this.document?.waypoint_type;
      switch (type) {
        case 'hut':
        case 'gite':
        case 'camp_site':
          return this.$gettext('Describe opening periods');
        case 'local_product':
          return this.$gettext('Describe opening hours');
        case 'climbing_outdoor':
          return this.$gettext('Describe access restrictions');
        default:
          return this.$gettext('Describe access period');
      }
    },
  },
};
