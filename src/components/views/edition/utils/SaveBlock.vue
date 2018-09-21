<template>
    <div class="field is-grouped">
        <div class="control">
            <button class="button is-primary" @click="save">
                Save
            </button>
        </div>
        <div class="control">
            <input v-model="comment" type="text" class="input" placeholder="comment">
        </div>
    </div>
</template>


<script>
    import { requireDocumentProperty } from '@/js/propertiesMixins.js'
    import c2c from '@/js/c2c.js'

    export default {
        mixins : [ requireDocumentProperty ],

        data(){
            return {
                comment:"",
            }
        },
        methods:{
            save(){
                c2c[this.document.type].save(this.document, this.comment)
            }
        }
    }
</script>
