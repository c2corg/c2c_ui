<template>
    <!-- TODO : v-if user admin -->
    <span>
        <a
            v-if="document.available_langs.length > 1"
            @click="$refs.modalWindow.show()"
            v-tooltip="$gettext('Delete this locale')">
            <fa-icon :icon="['fas','trash']" />
        </a>

        <modal-confirmation
            ref="modalWindow"
            show-uncancelable-warning
            @confirm="executeDelete">

            <span slot="title" v-translate>
                Delete this locale
            </span>

            <span v-translate>
                Are you sure you want to delete this locale?
            </span>

        </modal-confirmation>

    </span>
</template>

<script>
    import c2c from '@/js/c2c'

    import { requireDocumentProperty, requireLocaleProperty } from '@/js/propertiesMixins.js'

    export default {
        mixins : [
            requireDocumentProperty,
            requireLocaleProperty
        ],

        methods:{
            executeDelete(){
                /* TODO ask confirm */
                c2c.moderator.deleteLocale(
                    this.document.document_id,
                    this.locale.lang
                ).then(() => {
                    /* TODO : redirect */
                })
            }
        }
    }

</script>
