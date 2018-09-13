<template>
    <div class="field">
        <label class="label">{{ label }}</label>
        <div class="control has-icons-left">
            <input :type="type" :placeholder="placeholder || label"
                   v-model="data.value" class="input">
            <span class="icon is-small is-left">
                <fa-icon :icon="icon"/>
            </span>
        </div>
    </div>
</template>

<script>
    export default {
        props:{
            label: String,
            type: String,
            placeholder: String,
            data: [String, Number],
            icon: String,
        }
    }
</script>
