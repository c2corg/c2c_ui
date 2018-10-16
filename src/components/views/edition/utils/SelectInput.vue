<template>
    <select-buttons
        v-if="prettyMode"
        :options="field.values"
        :multiple="!!field.multiple"
        :required="field.required"
        :i18n="field.i18n"
        v-model="document[field.name]"/>

    <div v-else class="field" :class="{'has-addons':prefix}">
        <div v-if="prefix" class="control">
            <span class="button is-static">
                <span class="is-first-letter-uppercase">
                    {{ prefix }}
                </span>
            </span>
        </div>

        <div class="control">
            <div :class="{'is-multiple':field.multiple}" class="select">
                <select
                    v-model="document[field.name]"
                    :multiple="!!field.multiple">
                    <option v-if="!field.required"/>
                    <option
                        v-for="v of field.values"
                        :key="v"
                        :value="v">
                        {{ field.i18n ? $gettext(v) : v }}
                    </option>
                </select>
            </div>
        </div>
    </div>
</template>

<script>
    import { requireDocumentProperty, requireFieldProperty } from '@/js/propertiesMixins.js'

    import SelectButtons from "./SelectButtons"

    export default {

        components: {
            SelectButtons
        },

        mixins : [ requireFieldProperty, requireDocumentProperty ],

        props : {
            prefix:{
                type:String,
                default:null,
            },
        },

        computed: {
            prettyMode(){
                return this.prefix === null
            },
        },
    }

</script>

<style>
    select {
        min-width:10rem;
    }

    .button:focus{
        background: white;
    }
</style>
