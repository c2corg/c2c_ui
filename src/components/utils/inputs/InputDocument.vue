<template>
    <div class="dropdown" :class="{'is-active':promise.data}">
        <div class="control has-icons-left">
            <input
                class="input is-primary"
                type="text"
                :placeholder="$gettext('Search ...')"
                @input="loadOptions"
                @focus="loadOptions"
                @blur="promise={}"
                v-model="searchText">
            <span class="icon is-left">
                <fa-icon icon="search"/>
            </span>
        </div>
        <div class="dropdown-menu" role="menu" v-if="promise.data">
            <div class="dropdown-content">
                <div
                    v-for="type of types"
                    :key="type"
                    v-if="promise.data[type + 's'] && promise.data[type + 's'].documents.length != 0">
                    <div class="dropdown-item has-text-weight-bold is-size-5 is-first-letter-uppercase">
                        <span>
                            {{ $gettext(type + 's') }}
                        </span>
                    </div>
                    <div
                        v-for="document of promise.data[type + 's'].documents"
                        :key="document.document_id"
                        @mousedown="toggle(document)"
                        class="dropdown-item dropdown-item-option columns is-gapless">

                        <div class="column is-size-6">
                            <document-title :document="document" class="5is-ellipsed"/>
                            <br>
                            <span v-if="document.elevation || document.elevation_max">
                                <span v-tooltip="$gettext('elevation_max')">
                                    <fa-icon icon="sort-amount-up" class="has-text-primary"/>
                                </span>
                                {{ document.elevation || document.elevation_max }}&nbsp;m
                            </span>

                            <span v-if="document.height_diff_up">
                                <icon-height-diff class="has-text-primary"/>
                                {{ document.height_diff_up }}&nbsp;m
                            </span>

                            &nbsp;
                        </div>

                        <div class="column has-text-primary is-size-1 is-narrow">
                            <activities v-if="document.activities" :activities="document.activities" />
                            <icon-waypoint-type v-else-if="document.waypoint_type" :waypoint-type="document.waypoint_type" />
                        </div>
                    </div>

                    <hr class="dropdown-divider">

                </div>

                <div class="dropdown-item has-text-weight-bold is-size-5 is-first-letter-uppercase" v-translate>
                    No match?
                </div>
                <add-link
                    v-for="type of types"
                    :key="type + '_add'"
                    :document-type="type"
                    class="dropdown-item dropdown-item-option is-size-6">
                    {{ $gettext('Create a new ' + type) }}
                </add-link>
            </div>
        </div>
    </div>
</template>

<script>
    import c2c from "@/apis/c2c"
    import constants from "@/js/constants"

    import { baseMixin, arrayMixin } from "./mixins.js"

    export default {
        mixins: [ baseMixin, arrayMixin ],

        props:{
            types:{
                type:Array,
                required: true,
            }
        },

        data(){
            return {
                searchText:"",
                promise:{},
            }
        },

        computed: {
            letterTypes(){
                return this.types.map(item => constants.objectDefinitions[item].letter)
            }
        },

        methods:{
            loadOptions(){
                if(!this.searchText || this.searchText.length <= 3){
                    this.promise = {}
                    return
                }

                this.promise = c2c.search({
                    q:this.searchText,
                    t:this.letterTypes.join(","),
                    limit:7,
                })
            },

            isSelected(value){
                for(let document of this.value_){
                    if(document.document_id == value.document_id)
                        return true
                }

                return false
            },

            toggle(value){
                var newValue = []
                var removed = false

                for(let document of this.value_){
                    if(document.document_id == value.document_id)
                        removed = true
                    else
                        newValue.push(document)
                }

                if(!removed){
                    newValue.push(value)
                }

                this.value_ = newValue
            }
        }
    }
</script>

<style scoped>

div.dropdown-item-option{
    cursor:pointer;
}

div.dropdown-item-option:hover{
    background: #EEE; /* TODO variables */
}

.dropdown-menu{
    max-width:30rem;
    min-width:30rem;
}
.dropdown-content{
    max-height:80vh;
    overflow-y: auto;
}
.columns{
    margin-bottom:0!important;
}

</style>
