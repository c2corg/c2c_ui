
/************************************************************************************************************
 Waypoint fields access and access_period has a different signification, depending of waypoint_type
 It implies different label/titles/placeholders. And this logic is needed in both document views and
 edition views. So we have to do a mixin for this logic

 Placeholders are needed only in edition views, but it's better to keep all thois logic on the same place
*************************************************************************************************************/

export default {
    computed: {
        descriptionTitle() {
            return this.document && this.document.waypoint_type === 'access' ? this.$gettext('road access') : this.$gettext('description')
        },

        accessTitle() {
            if (!this.document) {
                return ''
            }

            if (this.document.waypoint_type === 'access') {
                return this.$gettext('public transportation access')
            }

            if (['hut', 'climbing_indoor', 'climbing_outdoor'].includes(this.document.waypoint_type)) {
                return this.$gettext('pedestrian access')
            }

            return this.$gettext('road or pedestrian access')
        },

        accessPeriodTitle() {
            if (!this.document) {
                return ''
            }

            if (['hut', 'gite', 'camp_site'].includes(this.document.waypoint_type)) {
                return this.$gettext('opening_periods')
            }

            if (this.waypoint_type === 'local_product') {
                return this.$gettext('opening_hours')
            }

            if (this.waypoint_type === 'climbing_outdoor') {
                return this.$gettext('restricted_access')
            }

            return this.$gettext('access_period')
        },

        descriptionPlaceholder() {
            let type = this.document ? this.document.waypoint_type : undefined

            if (type === 'access') {
                return this.$gettext('Describe here the waypoint')
            }

            return this.$gettext('Describe road access')
        },

        accessPlaceholder() {
            let type = this.document ? this.document.waypoint_type : undefined

            if (type === 'access') {
                return this.$gettext('Describe pt access')
            }

            if (type === 'hut' || type === 'climbing_indoor' || type === 'climbing_outdoor') {
                return this.$gettext('Describe pedestrian access')
            }

            return this.$gettext('Describe access')
        },

        accessPeriodPlaceholder() {
            let type = this.document ? this.document.waypoint_type : undefined

            if (type === 'hut' || type === 'gite' || type === 'camp_site') {
                return this.$gettext('Describe opening periods')
            }

            if (type === 'local_product') {
                return this.$gettext('Describe opening hours')
            }

            if (type === 'climbing_outdoor') {
                return this.$gettext('Describe access restrictions')
            }

            return this.$gettext('Describe access period')
        }
    }
}
