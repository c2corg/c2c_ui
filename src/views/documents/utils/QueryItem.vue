<template>
    <div v-if="field!==undefined" class="field">
        <div v-if="field.queryMode==='valuesRangeSlider'" class="control" >

            <query-item-slider-label :field="field" :value="value"/>
            <vue-slider
                ref="slider"
                v-model="value"
                :data="field.values"
                :lazy="true"
                :piecewise="true"
                tooltip="hover"
                :formatter="field.i18n ? $gettext : undefined"/>

        </div>

        <div v-else-if="field.queryMode==='numericalRangeSlider'" class="control">
            <query-item-slider-label :field="field" :value="value"/>
            <vue-slider ref="slider" v-model="value"
                        :min="field.min" :max="field.max" :lazy="true"
                        tooltip="hover"/>
        </div>

        <div v-else-if="field.queryMode==='multiSelect'" class="control">
            <label class="label">
                {{ $gettext(field.name) | uppercaseFirstLetter }}
            </label>

            <multiselect v-model="value"
                         :options="field.values"
                         :custom-label="field.i18n ? $gettext : undefined"
                         :multiple="true"/>
        </div>

        <div v-else-if="field.queryMode==='orientations'" class="level">
            <input-orientation v-model="value" class="level-item"/>
        </div>

        <div v-else-if="field.queryMode==='input'" class="control">
            <label class="label">
                {{ $gettext(field.name) | uppercaseFirstLetter }}
            </label>
            <input :type="field.type" v-model="value" class="input is-primary">
        </div>

        <div v-else-if="field.queryMode==='checkbox'" class="control">
            <input-checkbox v-model="value">
                {{ $gettext(field.name) }}
            </input-checkbox>
        </div>

        <div v-else-if="field.queryMode==='activities'" class="control">
            <input-activity v-model="value"/>
        </div>

        <div v-else-if="field.queryMode==='dates'">
            <date-query-item />
        </div>

        <div v-else class="notification is-danger">
            <!-- Should not happen, message for devs -->
            Please fill queryMode for {{ field.name }}
        </div>
    </div>
</template>

<script>
    import { requireFieldProperty } from '@/js/properties-mixins'

    import QueryItemMixin from './QueryItemMixin.js'

    import Multiselect from 'vue-multiselect'
    import vueSlider from 'vue-slider-component'
    import QueryItemSliderLabel from './QueryItemSliderLabel'
    import DateQueryItem from './DateQueryItem'

    export default {

        components: {
            Multiselect,
            vueSlider,
            QueryItemSliderLabel,
            DateQueryItem
        },

        mixins: [ requireFieldProperty, QueryItemMixin ],

        // debug test, do not remove it
        // created(){
        //     if(!this.field.url)
        //         throw `Please enter url property for field ${this.field.name}`
        // },

        methods: {
            refreshSlider() {
                if (this.$refs.slider) {
                    this.$nextTick(() => this.$refs.slider.refresh())
                }
            }
        }
    }
</script>

<style src="vue-multiselect/dist/vue-multiselect.min.css"></style>

<style scoped>

/*
If a multi select is below a slider, multi select  popup is bellow slider elements.
set z-index to 6 (5 is the highest slider z-index value) to fix this
*/
.multiselect--active {
  z-index: 6;
}

</style>
