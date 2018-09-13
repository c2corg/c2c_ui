<template>
    <div v-if="field.isVisibleFor(document)" class="column">
        <div class="field">
            <label>
                {{ field.name }}
                <span v-if="field.required">*</span>
            </label>
            <div class="columns is-multiline is-gapless">
                <div v-for="item of field.values" :key="item" class="column is-6">
                    <label class="checkbox">
                        <input type="checkbox" value="document[field.name].includes(item)">
                        {{ item }}
                    </label>
                </div>
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
</scrip