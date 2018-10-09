<template>
    <multiselect
        v-model="value_"
        @search-change="search"
        @input="$emit('input', value_)"
        :internal-search="false"
        :loading="loading"
        :options="options"
        :multiple="false"
    >

        <template slot="singleLabel" slot-scope="props">
            <!-- <img class="option__image" :src="props.option.img" alt="No Man’s Sky"> -->
            <span class="option__desc">
                <document-title class="option__title" :document="props.option" />
            </span>
        </template>

        <template slot="option" slot-scope="props">
            <!-- <img class="option__image" :src="props.option.img" alt="No Man’s Sky"> -->
            <div v-if="props.option.type=='o'" class="option__desc">
                <icon-activity :activity="props.option.activities[0]" />
                <span class="option__title">
                    <document-title :document="props.option" />
                </span>
                <span class="option__small">
                    {{ props.option.author.name }}
                    <!-- TODO format moment -->
                    {{ props.option.date_start }}
                </span>
            </div>

            <div v-else-if="props.option.type=='u'" class="option__desc">
                <icon-document type="profile" />
                <span class="option__title">
                    <document-title :document="props.option" />
                </span>
                <span class="option__small">
                    (@{{ props.option.forum_username }})
                </span>
            </div>

            <!-- TODO template pour tous les types... -->
            <div v-else class="option__desc">
                <span class="option__title">
                    <document-title :document="props.option" />
                </span>
                <span class="option__small">
                    {{ props.option.type }}
                </span>
            </div>

        </template>
    </multiselect>

</template>

<script>

import c2c from '@/js/c2c'
import constants from '@/js/constants'

import Multiselect from 'vue-multiselect'

export default {
    components:{
        Multiselect
    },

    props:{
        type:{
            type:String,
            required:true,
        },
        value: {
            type:[Array, Object],
            default:null,
        },
    },

    data(){
        return {
            value_:null,
            promise:null,
        }
    },

    computed:{
        type_(){
            return constants.getDocumentType(this.type)
        },

        letterType(){
            return constants.objectDefinitions[this.type_].letter
        },

        loading(){
            return this.promise && !this.promise.data
        },

        options(){
            let type = this.type_ == "profile" ? "user" : this.type_  //API anti-pattern...
            return this.promise && this.promise.data ? this.promise.data[type + 's'].documents : []
        },
    },

    created(){
        this.value_ = this.value
    },

    methods:{
        search(searchText){
            if(searchText.length >= 3){
                var query = {q:searchText, t:this.letterType}

                this.promise = c2c.search(query)
            }
        }
    }
}

</script>
