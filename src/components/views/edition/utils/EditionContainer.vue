<template>
    <div v-if="document" class="section">
        <html-header title="Edit a document"/>
        <h1 class="title">
            <!-- TODO  v-translate -->
            Edit
            <document-title :document="document"/>
            in
            {{ $gettext(document.currentLocale_.lang) }}
        </h1>

        <div v-for="(error, i) of genericErrors" :key="i" class="has-text-danger has-text-weight-bold">
            {{ error.name }}
            :
            {{ error.description }}
        </div>

        <slot :document="document" :fields="fields">
            ...
        </slot>

        <form-row label="" always-visible is-grouped>
            <div class="control">
                <button
                    class="button is-primary"
                    :class="{'is-loading':promise && promise.loading}"
                    @click="save"
                    v-translate>
                    Save
                </button>
            </div>
            <div v-show="mode=='edit'" class="control is-expanded">
                <input v-model="comment" type="text" class="input" :placeholder="$gettext('comment')">
            </div>
        </form-row>

    </div>
</template>

<script>

    import constants from '@/js/constants.js'
    import c2c from '@/apis/c2c'

    import FormRow from './FormRow'

    export default {

        components : { FormRow },

        data() {
            return {
                promise:null,
                fields:null, // keep fields here to set them reactive
                genericErrors:[],
                comment:"",
            }
        },

        computed: {
            documentId(){
                return this.$route.params.id
            },

            lang(){
                return this.$route.params.lang || this.$language.current
            },

            document(){
                let doc = this.promise.data

                if(doc){
                    var locale = this.$documentUtils.getLocaleStupid(doc, this.lang)

                    if(!locale){
                        locale = constants.buildLocale(this.documentType, this.lang)
                        doc.locales.push(locale)
                    }

                    doc.currentLocale_ = locale
                }

                return doc
            },

            documentType(){
                return this.$route.name.replace(/-(edit|add)/,"")
            },

            mode(){
                return this.$route.name.split("-")[1] // right part of route name : add or edit
            },
        },

        created(){
            if(this.mode=="edit")
                this.promise = c2c[this.documentType].get(this.documentId)
            else
                this.promise = { data : constants.buildDocument(this.documentType, this.lang) }

            this.fields = constants.objectDefinitions[this.documentType].fields

            this.cleanErrors()
        },

        methods: {
            save(){
                if (this.hasError())
                    return

                let promise

                if(this.mode=="edit"){
                    promise = c2c[this.documentType].save(this.document, this.comment).then(() => {
                        this.$router.push({name:this.documentType, params:{id:this.document.document_id}})
                    })
                } else {
                    promise = c2c[this.documentType].create(this.document).then(response => {
                        this.$router.push({name:this.documentType, params:{id:response.data.document_id}})
                    })
                }

                promise.catch(error => {
                    const data = error.response.data
                    this.dispatchErrors(data.errors)
                })
            },

            hasError(){
                let hasError = false

                for(let field of Object.values(this.fields)){
                    let error = field.getError(this.document)
                    hasError = hasError || error !==null
                    field.error = error
                }

                return hasError
            },

            dispatchErrors(errors){

                // TODO : errors == undefined ?
                this.cleanErrors()

                for(let error of errors){
                    let path = error.name.split(".")

                    if(path[0]=="locales")
                        this.dispatchError(path[2], error)
                    else
                        this.dispatchError(path[0], error)

                }
            },

            dispatchError(fieldName, error){
                if(this.fields[fieldName] === undefined)
                    this.genericErrors.push(error)
                else
                    this.fields[fieldName].error = error
            },

            cleanErrors(){
                this.genericErrors = []
                for(let field of Object.values(this.fields))
                    field.error = null
            }
        }
    }
</script>
