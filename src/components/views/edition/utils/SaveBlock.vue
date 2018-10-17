<template>
    <form-row label="" always-visible is-grouped>
        <div class="control">
            <button class="button is-primary" @click="$emit('save', comment)" v-translate>
                Save
            </button>
        </div>
        <div class="control is-expanded">
            <input v-model="comment" type="text" class="input" :placeholder="$gettext('comment')">
        </div>
    </form-row>
</template>


<script>
    import { requireDocumentProperty } from '@/js/propertiesMixins.js'
    import c2c from '@/js/c2c'
    import constants from '@/js/constants'

    import FormRow from "./FormRow"

    export default {

        components: {
            FormRow
        },

        mixins : [ requireDocumentProperty ],

        data(){
            return {
                comment:"",
            }
        },
    }
</script>
