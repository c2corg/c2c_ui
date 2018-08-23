<template>
    <div class="column" v-if="field.isVisibleFor(document)">
        <div class="field">
            <label>
                {{field.name}}
                <span v-if="field.required">*</span>
            </label>
            <div class="control">
                <label class="checkbox" v-for="item of field.values" :key="item">
                    <input type="checkbox" value="document[field.name].includes(item)">
                    {{item}}
                </label>
            </div>
        </div>
    </div>
</template>

<script>
    import constants from "@/js/constants.js"

    export default {
        props:["document", "field"],

        data(){
            return {
                object:this.document,
                constants,
            }
        }
    }
</script>
