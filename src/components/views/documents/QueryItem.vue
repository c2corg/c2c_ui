<template>
    <div class="field" v-if="field!==undefined">

        <div v-if="field.queryMode==='valuesRangeSlider'">
            <span>{{value[0]}}</span>
            {{field.label}}
            <span class="is-pulled-right">{{value[1]}}</span>
        </div >

        <div v-else-if="field.queryMode==='numericalRangeSlider'">
            <span>{{value[0]}}&nbsp;{{field.unit}}</span>
            {{field.label}}
            <span class="is-pulled-right">{{value[1]}}&nbsp;{{field.unit}}</span>
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

                    if(this.field.queryMode=="valuesRangeSlider"){
                        let result = this.urlValue || this.field.defaultUrlQuery
                        return result.split(",")
                    }

                    if(this.field.queryMode=="numericalRangeSlider"){
                        let result = this.urlValue || this.field.defaultUrlQuery
                        result = result.split(",")
                        return [parseInt(result[0]), parseInt(result[1])]
                    }

                    if(this.field.queryMode=="multiSelect"){
                        let result = this.urlValue

                        if(!result)
                            return []

                        return result.split(",")
                    }

                    if(this.field.queryMode=="checkbox"){
                        let result = this.urlValue

                        if(result === null || result === undefined || result === '' || result === 'false')
                            return false

                        return true
                    }

                    if(this.field.queryMode=="input"){
                        if(this.field.type === "number"){
                            return parseInt(this.urlValue || this.field.defaultUrlQuery)
                        }

                        if(this.field.type === "text"){
                            return this.urlValue || this.field.defaultUrlQuery
                        }
                    }

                    return this.urlValue || this.field.defaultUrlQuery

                },
                set(value){
                    this.urlValue = this.field.getUrlValue(value)
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
