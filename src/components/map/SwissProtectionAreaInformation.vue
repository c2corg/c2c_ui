<template>
    <modal-window ref="modalWindow">
        <div slot="header" class="has-text-centered">
            <span v-translate>
                Sensitive area:
            </span>
            <span>
                {{ data.label }}
            </span>
        </div>
        <p v-if="protectionStatus">
            <span v-translate>Protection status:</span>
            <span>{{ protectionStatus }}</span>
        </p>
        <p v-if="data.schutzzeit">
            <span v-translate>Period of protection:</span>
            <span>{{ data.schutzzeit }}</span>
        </p>


        <!-- TODO : find a light way to securely show this content -->
        <p>{{ description }}</p>
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
            description() {
                let result = this.data.zusatzinformation || ''

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
                return this.data[`schutzs_${lang}`]
            }
        },

        methods: {
            show() {
                this.$refs.modalWindow.show()
            }
        }
    }

</script>
