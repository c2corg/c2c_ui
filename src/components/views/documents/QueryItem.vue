<template>
    <div class="field" v-if="field!==undefined">

        <div v-if="field.queryMode==='valuesRangeSlider' || field.queryMode==='numericalRangeSlider'">
            <div class="level"> <!--level must be in a single element to remove bottim margin : todo remove ugly hack -->
                <div class="level-left">
                    <span class="level-item query-bound-value">
                        {{value[0]}}
                        <span v-if="field.unit">&nbsp;{{field.unit}}</span>
                    </span>
                </div>
                <div class="level-item query-label">
                    {{field.label}}
                </div>
                <div class="level-right">
                    <span class="level-item query-bound-value">
                        {{value[1]}}
                        <span v-if="field.unit">&nbsp;{{field.unit}}</span>
                    </span>
                </div>
            </div >
        </div>

        <label v-else-if="field.queryMode!=='checkbox'" class="label">
            {{field.label}}
        </label>

        <div class="control">

            <vue-slider v-if="field.queryMode==='valuesRangeSlider'" ref="slider" v-model="value"
                :data="field.values" :lazy="true"
                tooltip="hover" :piecewise="true">
            </vue-slider>

            <vue-slider v-else-if="field.queryMode==='numericalRangeSlider'" ref="slider" v-model="value"
                :min="field.min" :max="field.max" :lazy="true"
                tooltip="hover">
            </vue-slider>

            <multiselect v-else-if="field.queryMode==='multiSelect'" v-model="value"
                :options="field.values"
                :multiple="true">
            </multiselect>

            <input v-else-if="field.queryMode==='input'" :type="field.type" class="input is-primary" v-model="value">

            <label v-else-if="field.queryMode==='checkbox'" class="checkbox">
                <input type="checkbox" v-model="value">
                {{field.label}}
            </label>

            <div v-else-if="field.queryMode==='activities'">
                <input-activity v-model="value"/>
            </div>

            <div v-else class="notification is-danger">
                Please fill queryMode for {{field.name}}
            </div>
        </div>

    </div>
</template>

<script>
    import Multiselect from 'vue-multiselect'
    import vueSlider from 'vue-slider-component'

    export default {

        components : {
            Multiselect,
            vueSlider,
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

.query-bound-value{
    font-weight:bold;
}

.query-label{
    font-style:italic;
}

</style>
