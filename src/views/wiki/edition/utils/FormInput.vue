<template>
    <input-activity
        v-if="field.name=='activities'"
        v-show="visible"
        :error-message="errorMessage"
        show-labels
        v-model="document.activities" />

    <input-orientation
        v-else-if="field.name=='orientations'"
        v-show="visible"
        v-model="document.orientations" />

    <div
        v-else-if="field.name=='main_waypoint_id'"
        class="control select"
        :class="{'is-danger': hasError}">
        <select v-model="document.main_waypoint_id">
            <option :value="null"/>
            <option
                v-for="waypoint of document.associations.waypoints"
                :key="waypoint.document_id"
                :value="waypoint.document_id">
                {{ $documentUtils.getDocumentTitle(waypoint) }}
            </option>
        </select>
    </div>

    <input-conditions-levels
        v-else-if="field.name=='conditions_levels'"
        v-model="object[field.name]"/>

    <input-markdown
        v-else-if="field.type=='markdown'"
        v-show="visible"
        :placeholder="placeholder"
        v-model="object[field.name]"/>

    <input-document
        v-else-if="field.parent=='associations'"
        :document-type="field.documentType"
        multiple
        :error-message="errorMessage"
        @add="$documentUtils.propagateAssociationProperties(document, arguments[0])"
        v-model="object[field.name]"/>

    <input-multi-select
        v-else-if="field.values && field.multiple"
        v-show="visible"
        :options="field.values"
        :required="field.required"
        :i18n="field.i18n"
        :i18n-context="field.i18nContext"
        :error-message="errorMessage"
        v-model="object[field.name]"/>

    <datepicker
        v-else-if="field.type === 'date'"
        monday-first
        input-class="input"
        wrapper-class="control"
        :language="$options.datepickerLocales[$language.current]"
        :highlighted="{dates:[new Date()]}"
        :disabled-dates="disabledDates"
        :required="field.required"
        @input="object[field.name]=$moment.parseDate(arguments[0]).format('YYYY-MM-DD')"
        :value="object[field.name]"/>

    <input-simple
        ref="input"
        v-else-if="simpleInputType"
        v-show="visible"
        :prefix="prefix"
        @click:prefix="$emit('click:prefix')"
        :helper="helper===undefined ? field.helper : helper"
        :is-expanded="isExpanded"
        :postfix="field.unit"
        :type="field.type"
        :min="min || field.min"
        :max="max || field.max"
        :disabled="field.disabled"
        :placeholder="placeholder || $gettext(field.name)"
        :required="field.required"
        :i18n="field.i18n"
        :i18n-context="field.i18nContext"
        :options="field.values"
        :error-message="errorMessage"
        @input="$emit('input', arguments[0])"
        v-model="object[field.name]"/>

    <input-yes-no
        v-else-if="field.type=='boolean'"
        v-show="visible"
        v-model="object[field.name]" />

    <div v-else class="notification is-danger">
        <!-- Should not happen, message to devs -->
        Unknown field type : {{ field.type }}
    </div>

</template>

<script>

    import Datepicker from 'vuejs-datepicker'
    import { fr, en, es, ca, de, it, eu } from 'vuejs-datepicker/dist/locale'

    import { requireDocumentProperty, requireFieldProperty } from '@/js/properties-mixins'
    import InputConditionsLevels from './InputConditionsLevels'

    // note that eu is missing. Sorry euskara...
    const datepickerLocales = {
        fr,
        en,
        es,
        ca,
        de,
        it
    }

    export default {
        components: { InputConditionsLevels, Datepicker },

        mixins: [ requireFieldProperty, requireDocumentProperty ],

        props: {
            prefix: {
                type: String,
                default: null
            },
            isExpanded: {
                type: Boolean,
                default: null
            },
            helper: {
                type: String,
                default: undefined
            },
            placeholder: {
                type: String,
                default: undefined
            },
            min: {
                type: String,
                default: undefined
            },
            max: {
                type: String,
                default: undefined
            }
        },

        computed: {
            disabledDates() {
                const min = this.min || this.field.min
                const max = this.max || this.field.max

                return {
                    to: min ? this.$moment.parseDate(min).toDate() : undefined,
                    from: max ? (this.$moment.parseDate(max).add(1, 'd').toDate()) : undefined
                }
            },

            editedLocale() {
                // in edit mode, there is only one locale
                return this.document.locales[0]
            },

            object() {
                if (this.field.parent === 'document') {
                    return this.document
                }

                if (this.field.parent === 'locales') {
                    return this.editedLocale
                }

                if (this.field.parent === 'associations') {
                    return this.document.associations
                }

                throw new Error(`Unexpected parent value : ${this.field.parent}`)
            },
            visible() {
                return this.field.isVisibleFor(this.document)
            },
            simpleInputType() {
                return ['text', 'number', 'url', 'tel'].includes(this.field.type)
            },
            hasError() {
                return this.field.error !== null
            },
            errorMessage() {
                return this.hasError ? this.$gettext(this.field.error.description) : null
            }
        },

        datepickerLocales: datepickerLocales
    }
</script>
