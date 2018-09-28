<template>
    <div v-if="field.isVisibleFor(document)" class="column">
        <div class="field">
            <label>
                <span>{{ $gettext(field.name) }}</span>
                <span v-if="field.required">*</span>
            </label>
            <div class="columns is-multiline is-gapless">
                <div v-for="item of field.values" :key="item" class="column is-6">
                    <label class="checkbox">
                        <input type="checkbox" value="document[field.name].includes(item)">
                        <span>{{ field.i18n ? $gettext(item) : item }}</span>
                    </label>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
    import { requireDocumentProperty, requireFieldProperty } from '@/js/propertiesMixins.js'
    import constants from "@/js/constants.js"

    export default {

        mixins : [ requireFieldProperty, requireDocumentProperty ],

        data(){
            return {
                object:this.document,
                constants,
            }
        }
    }
</script>
