<template>
    <div class="column">
        <div class="field">
            <label>
                activities
                <span v-if="field.required">*</span>
            </label>
            <div class="control">
                <input-activity v-model="document.activities" />
            </div>
        </div>
    </div>
</template>

<script>
    import { props } from '@/js/properties.js'
    import constants from "@/js/constants.js"

    export default {
        props : props.requiredDocument,

        data(){
            return {
                field:constants.objectDefinitions[constants.getDocumentType(this.document.type)].fields.activities,
                object:this.document,
                constants,
            }
        }
    }
</script>
