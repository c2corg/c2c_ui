<template>
    <modal-window ref="modalWindow">
        <div slot="header" class="has-text-centered">
            <span v-translate>
                Sensitive area:
            </span>
            <span>
                {{ data.title }}
            </span>
        </div>

        <p v-if="data.period">
            <span v-translate>sensitive_months:</span>
            <span>{{ months.join(", ") }}</span>
        </p>

        <!-- TODO : find a light way to securely show this content -->
        <p>{{ description }}</p>
        <a :href="data.infoUrl" target="_blank" v-translate>More info</a> |
        <a :href="data.kmlUrl" target="_blank">KML</a>
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
                let result = this.data.description || ''

                // very simple html > text interpreter : only html entities
                result = result.replace(/&eacute;/g, 'é')
                result = result.replace(/&egrave;/g, 'è')
                return result
            },

            months() {
                const result = []

                for (const month in this.data.period) {
                    if (this.data.period[month]) {
                        result.push(this.$moment.month(parseInt(month, 10)))
                    }
                }

                return result
            }
        },

        methods: {
            show() {
                this.$refs.modalWindow.show()
            }
        }
    }

</script>
