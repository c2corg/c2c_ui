<template>
    <span>
        <span class="tag is-info" v-for="url of Object.keys(query)" :key="url">
            {{getLabel(url)}}
            :
            {{query[url]}}
            <button class="delete is-small" @click="remove(url)"></button>
        </span>
    </span>
</template>

<script>

    import constants from '@/js/constants.js'

    export default {
        data(){
            return {
                query:Object.assign({}, this.$route.query),
                type: this.$route.name.slice(0, -1),
                urlToField:{},

            }
        },

        created(){
            for(let field of Object.values(constants.objectDefinitions[this.type].fields)){
                if(field.url){
                    this.urlToField[field.url] = field;
                }          
            }
        },

        methods:{
            remove : function(url){
                this.$delete(this.query, url)
                this.$router.push({query:this.query})
            },

            getLabel(url){
                if(this.urlToField[url]){
                    return this.urlToField[url].label;
                } else {
                    return url; 
                }
            }

        }
    }
</script>
