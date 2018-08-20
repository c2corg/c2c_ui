<template>
    <div class="field is-grouped">
        <div class="control">
            <button class="button is-primary" @click="save">
                Save
            </button>
        </div>
        <div class="control">
            <input type="text" class="input" placeholder="comment" v-model="comment"/>
        </div>
    </div>
</template>


<script>
    import c2c from '@/js/c2c.js'

    export default {
        props : ["document"],
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
