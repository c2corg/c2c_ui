
import constants from '@/js/constants.js'
import c2c from '@/js/c2c.js'
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
        EditSection
    },

    data() {
        return {
            documentId: this.$route.params.id,
            mode: null,
            type: null,
            document: null,
            locale: null,
            fields: null,
        }
    },

    created(){

        if(this.$route.name.endsWith("-edit")){
            this.type = this.$route.name.replace("-edit","");
            this.mode = "edit"

            c2c[this.type].get(this.$route.params.id).then(response => {
                this.document=response.data
                this.locale = user.getLocaleStupid(this.document, this.$route.params.lang)
            });
        } else {
            this.type = this.$route.name.replace("-add","");
            this.mode = "add"
            this.document = constants.buildDocument(this.type,
                this.$route.params.lang || this.$language.current)

            this.locale = this.document.locales[0]

        }

        this.fields = constants.objectDefinitions[this.type].fields

    },
}
