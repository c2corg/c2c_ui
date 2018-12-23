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

        <p v-if="data.months">
            <span v-translate>sensitive_months:</span>
            <span>{{ data.months.join(", ") }}</span>
        </p>

        <!-- TODO : find a light way to securely show this content -->
        <p>{{ data.description }}</p>
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

        methods: {
            show() {
                this.$refs.modalWindow.show()
            }
        }
    }

</script>
