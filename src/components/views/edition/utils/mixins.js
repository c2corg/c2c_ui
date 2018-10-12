
import constants from '@/js/constants.js'
import c2c from '@/js/c2c'
import user from '@/js/user.js'

import EditionContainer from './EditionContainer'
import InputBase from './InputBase'
import InputActivities from './InputActivities'
import InputCheckboxes from './InputCheckboxes'
import EditSection from './EditSection'

export default{
    components:{
        EditionContainer,
        InputBase,
        InputActivities,
        InputCheckboxes,
        EditSection,
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
            return this.promise.data
        },

        locale(){
            if(this.mode=="add")
                return this.document.locales[0]

            const locale = user.getLocaleStupid(this.document, this.lang)

            if(!locale){
                locale = constants.buildLocale(this.type, this.lang)
                this.document.locales.push(locale)
            }

            return locale
        }
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

    },
}
