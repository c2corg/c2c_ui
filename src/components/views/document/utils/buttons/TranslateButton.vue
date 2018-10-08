<template>
    <span v-if="hasMissingLangs">
        <a @click="$refs.modalWindow.show()" v-tooltip="$gettext('Translate into an other lang')">
            <fa-icon icon="edit" />
        </a>
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
    </span>
</template>

<script>
    import constants from '@/js/constants'

    import { requireDocumentProperty } from '@/js/propertiesMixins.js'

    export default {
        mixins : [
            requireDocumentProperty
        ],

        data(){
            return {
                langs:["fr", "de"],
            }
        },

        computed:{
            missingLangs(){
                var result = []

                for(let lang of constants.langs){
                    if(!this.document.available_langs.includes(lang))
                        result.push(lang)
                }

                return result
            },

            hasMissingLangs(){
                return this.missingLangs.length > 0
            }
        }
    }

</script>
