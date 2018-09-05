<template>
    <div>

        <div class="columns is-multiline">
            <div class="column is-3" v-for="field of visibleQueryItems" :key="field.url">
                <query-item :field="field"></query-item>
            </div>
        </div>

        <div class="modal" :class="{'is-active': fieldSelector==='visible'}">
            <div class="modal-background" @click="fieldSelector='hidden'"></div>
            <div class="modal-card">
                <header class="modal-card-head">
                    <p class="modal-card-title">
                        Modal title
                    </p>
                    <button class="delete" aria-label="close" @click="fieldSelector='hidden'"></button>
                </header>
                <section class="modal-card-body">
                    <div class="columns is-multiline is-variable is-0">
                        <div class="column is-4" v-for="field of Object.values(urlToField)" :key="field.name">
                            <div class="button" :class="{'is-success' : isSelected(field)}"
                                @click="toggle(field)">
                                {{field.label}}
                            </div>
                        </div>
                    </div>
                </section>
                <footer class="modal-card-foot">
                    <button class="button is-success" @click="fieldSelector='hidden'">Close</button>
                </footer>
            </div>
        </div>
    </div>
</template>

<script>
    import constants from '@/js/constants.js'
    import QueryItem from './QueryItem'

    export default {
        components:{
            QueryItem
        },

        data(){
            return {
                visibleQueryItems:[],
                fieldSelector:'hidden',
            }
        },

        computed:{
            type() {
                return this.$route.name.slice(0, -1)
            },
            urlToField(){
                var result = {}

                for(let field of Object.values(constants.objectDefinitions[this.type].fields)){
                    if(field.url){
                        result[field.url] = field
                    }
                }

                return result
            }
        },

        created(){
            this.initialize()
        },

        methods:{
            initialize(){

                for(let url of Object.keys(this.$route.query)){
                    let field = this.urlToField[url]

                    if(field && !this.isSelected(field)){
                        this.visibleQueryItems.push(field)
                    }
                }
            },

            showFieldSelector(){
                this.fieldSelector = 'visible'
            },

            toggle(field){
                this.visibleQueryItems.toggle(field)
            },

            isSelected(field){
                return this.visibleQueryItems.includes(field)
            },

        }
    }
</script>
