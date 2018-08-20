<template>
    <div class="field">
        <label>
            activities
            <span v-if="field.required">*</span>
        </label>
        <div class="control">
            <span v-for="activity of constants.activities"
                  :key="activity" @click="document.activities.toggle(activity)"
                  :class="{'selected':document.activities.contains(activity)}">
                <icon-activity :activity="activity" />
            </span>
        </div>
    </div>
</template>

<script>
    import constants from "@/js/constants.js"

    export default {
        props:["document"],

        data(){
            return {
                field:constants.objectDefinitions[constants.getDocumentType(this.document.type)].fields.activities,
                object:this.document,
                constants,
            }
        }
    }
</script>

<style>

.control > span {
    cursor:pointer;
}
.selected i{
    color:red;
}
</style>
