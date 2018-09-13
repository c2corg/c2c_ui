<template>
    <div v-if="field!==undefined" class="field">
        <div v-if="field.queryMode==='valuesRangeSlider'" class="control" >

            <query-item-slider-label :field="field" :value="value"/>
            <vue-slider ref="slider" v-model="value"
                        :data="field.values" :lazy="true"
                        :piecewise="true" tooltip="hover"/>

        </div>

        <div v-else-if="field.queryMode==='numericalRangeSlider'" class="control">
            <query-item-slider-label :field="field" :value="value"/>
            <vue-slider ref="slider" v-model="value"
                        :min="field.min" :max="field.max" :lazy="true"
                        tooltip="hover"/>
        </div>

        <div v-else-if="field.queryMode==='multiSelect'" class="control">
            <label class="label is-first-letter-uppercase">
                {{ field.label }}
            </label>

            <multiselect v-model="value"
                         :options="field.values"
                         :multiple="true"/>
        </div>

        <div v-else-if="field.queryMode==='orientations'" class="level">
            <input-orientation v-model="value" class="level-item"/>
        </div>

        <div v-else-if="field.queryMode==='input'" class="control">
            <label class="label is-first-letter-uppercase">
                {{ field.label }}
            </label>
            <input :type="field.type" v-model="value" class="input is-primary">
        </div>

        <div v-else-if="field.queryMode==='checkbox'" class="control">
            <label class="checkbox">
                <input v-model="value" type="checkbox">
                {{ field.label }}
            </label>
        </div>

        <div v-else-if="field.queryMode==='activities'" class="control">
            <input-activity v-model="value"/>
        </div>

        <div v-else class="notification is-danger">
            Please fill queryMode for {{ field.name }}
        </div>
    </div>
</template>

<script>
    import Multiselect from 'vue-multiselect'
    import vueSlider from 'vue-slider-component'

    import QueryItemSliderLabel from './QueryItemSliderLabel'

    export default {

        components : {
            Multiselect,
            vueSlider,
            QueryItemSliderLabel,
        },

        props : ["field", ],

        computed:{

            urlValue:{
                get(){
                    return this.$route.query[this.field.url]
                },
                set(value){
                    var query = Object.assign({}, this.$route.query)
                    query[this.field.url] = value === this.field.defaultUrlQuery ? undefined : value

                    if(query[this.field.url]!==this.$route.query[this.field.url]){
                        this.$router.push({query: query})
                    }
                }
            },

            value:{
                get(){
                    return this.field.urlToValue(this.urlValue)
                },
                set(value){
                    this.urlValue = this.field.valueToUrl(value)
                }
            }
        },

        methods: {
            refreshSlider(){
                if(this.$refs.slider) {
                    this.$nextTick(() => this.$refs.slider.refresh());
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
