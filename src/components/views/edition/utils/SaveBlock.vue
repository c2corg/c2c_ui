<template>
    <field-row label="">
        <div class="field is-grouped">
            <div class="control">
                <button class="button is-primary" @click="save" v-translate>
                    Save
                </button>
            </div>
            <div class="control">
                <input v-model="comment" type="text" class="input" :placeholder="$gettext('comment')">
            </div>
        </div>
    </field-row>
</template>


<script>
    import { requireDocumentProperty } from '@/js/propertiesMixins.js'
    import c2c from '@/js/c2c'
    import constants from '@/js/constants'

    import FieldRow from "./FieldRow"

    export default {
        mixins : [ requireDocumentProperty ],

        components: {
            FieldRow
        },

        data(){
            return {
                comment:"",
            }
        },
        methods:{
            save(){
                let type = constants.getDocumentType(this.document.type)
                c2c[type].save(this.document, this.comment)
                .then(() => {
                    this.$router.push({name:type, params:{id:this.document.document_id}})
                })
                .catch(() => {
                    // TODO
                })
            }
        }
    }
</script>
