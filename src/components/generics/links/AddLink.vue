<template>
    <!-- We alawys display this link, even when user is not logged
    In this case, editions vues will redirect user to /auth -->
    <router-link :to="{name:documentType + '-add', params:{lang:$language.current}, query:query}">
        <slot>
            <span class="is-first-letter-uppercase">
                {{ text }}
            </span>
        </slot>
    </router-link>
</template>

<script>
    import { requireDocumentTypeProperty } from '@/js/properties-mixins'

    export default{
        mixins: [ requireDocumentTypeProperty ],

        props: {
            query: {
                type: Object,
                default: null
            }
        },

        computed: {
            text() {
                if (this.documentType == 'outing') return this.$gettext('add an outing')
                if (this.documentType == 'route') return this.$gettext('Create a new route')
                if (this.documentType == 'image') return this.$gettext('add an image')
                if (this.documentType == 'waypoint') return this.$gettext('add a waypoint')
                if (this.documentType == 'map') return this.$gettext('add a map')
                if (this.documentType == 'xreport') return this.$gettext('add an incident/accident report')
                if (this.documentType == 'area') return this.$gettext('add an area')
                if (this.documentType == 'book') return this.$gettext('add a book')
                if (this.documentType == 'article') return this.$gettext('add an article')

                throw new Error(`Unexpected type : ${this.documentType}`)
            }
        }
    }
</script>
