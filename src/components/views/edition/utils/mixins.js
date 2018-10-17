
import constants from '@/js/constants.js'
import c2c from '@/js/c2c'
import user from '@/js/user.js'

import EditionContainer from './EditionContainer'

import TabItem from './TabItem'
import TabView from './TabView'

import FormRow from './FormRow'
import FormInputRow from './FormInputRow'
import FormInput from './FormInput'

export default{
    components:{
        EditionContainer,

        TabView,
        TabItem,

        FormRow,

        FormInput,
        FormInputRow,

    },

    data() {
        return {
            mode: null,
            type: null,
            fields: null,
            promise:null,
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
                var locale = user.getLocaleStupid(doc, this.lang)

                if(!locale){
                    locale = constants.buildLocale(this.type, this.lang)
                    doc.locales.push(locale)
                }

                doc.currentLocale_ = locale
            }

            return doc
        },
    },

    created(){

        if(this.$route.name.endsWith("-edit")){
            this.type = this.$route.name.replace("-edit","");
            this.mode = "edit"
            this.promise = c2c[this.type].get(this.$route.params.id)
        } else {
            this.type = this.$route.name.replace("-add","");
            this.mode = "add"
            this.promise = {
                data : constants.buildDocument(this.type, this.lang)
            }
        }

        this.fields = constants.objectDefinitions[this.type].fields
        this.cleanErrors()

    },

    methods: {
        save(comment){
            let promise

            if(this.mode=="edit"){
                promise = c2c[this.type].save(this.document, comment).then(() => {
                    this.$router.push({name:this.type, params:{id:this.document.document_id}})
                })
            } else {
                promise = c2c[this.type].create(this.document, comment).then(response => {
                    this.$router.push({name:this.type, params:{id:response.data.document_id}})
                })
            }

            promise.catch(error => {
                const data = error.response.data
                this.dispatchErrors(data.errors)
            })
        },

        dispatchErrors(errors){

            // TODO : errors == undefined
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
            // TODO field nothing?
            this.fields[fieldName].error = error
        },

        cleanErrors(){
            for(let field of Object.values(this.fields))
                field.error = null
        }
    }
}
