<template>
    <modal-window ref="modalWindow">
        <div slot="header" class="has-text-centered">
            <span>
                {{ type }}
            </span>
            <span>
                {{ data.properties.label }}
            </span>
        </div>
        <table>
            <tbody>
                <tr v-if="protectionStatus">
                    <td v-translate>Protection status</td>
                    <td>{{ protectionStatus }}</td>
                </tr>
                <tr v-if="data.properties.schutzzeit">
                    <td v-translate>Period of protection</td>
                    <td>{{ data.properties.schutzzeit }}</td>
                </tr>
                <tr v-if="dispositions.length > 0">
                    <td v-translate>Dispositions</td>
                    <td>{{ dispositions }}</td>
                </tr>
                <tr v-if="additionalInformation.length > 0">
                    <td v-translate>Additional information</td>
                    <td>{{ additionalInformation }}</td>
                </tr>
            </tbody>
        </table>
    </modal-window>
</template>

<script>
    export default {
        props: {
            data: {
                type: Object,
                default: null
            }
        },

        computed: {
            type() {
                switch (this.data.layerBodId) {
                // FIXME
                case 'ch.bafu.wrz-wildruhezonen_portal':
                    return 'Zone de protection:'
                case 'ch.bafu.wrz-jagdbanngebiete_select':
                    return 'Site de protection de la faune:'
                default:
                    return 'Zone sensible:'
                }
            },
            dispositions() {
                let lang = this.$language.current
                if (lang !== 'fr' && lang !== 'de' && lang !== 'it') {
                    lang = 'fr'
                }
                let result = this.data.properties[`best_${lang}`] || ''

                // very simple html > text interpreter : only html entities
                result = result.replace(/&eacute;/g, 'é')
                result = result.replace(/&egrave;/g, 'è')
                return result
            },
            additionalInformation() {
                let result = this.data.properties.zusatzinformation || ''

                // very simple html > text interpreter : only html entities
                result = result.replace(/&eacute;/g, 'é')
                result = result.replace(/&egrave;/g, 'è')
                return result
            },
            protectionStatus() {
                let lang = this.$language.current
                if (lang !== 'fr' && lang !== 'de' && lang !== 'it') {
                    lang = 'fr'
                }
                return this.data.properties[`schutzs_${lang}`]
            }
        },

        methods: {
            show() {
                this.$refs.modalWindow.show()
            }
        }
    }

</script>
