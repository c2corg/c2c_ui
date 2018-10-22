<template>
    <modal-window ref="modalWindow">
        <div slot="header" class="has-text-centered">
            <span v-translate>
                Translate into an other lang
            </span>
        </div>
        <div v-for="lang in missingLangs" :key="lang" class="has-text-centered">
            <edit-link
                class="is-first-letter-uppercase is-size-4"
                :id="document.document_id"
                :type="document.type"
                :lang="lang">
                {{ $gettext(lang) }}
            </edit-link>
        </div>
    </modal-window>
</template>

<script>
    import { requireDocumentProperty } from '@/js/propertiesMixins.js'

    export default {
        mixins : [
            requireDocumentProperty
        ],

        props: {
            missingLangs:{
                type:Array,
                required: true,
            }
        },

        methods:{
            show(){
                this.$refs.modalWindow.show()
            }
        }
    }

</script>
