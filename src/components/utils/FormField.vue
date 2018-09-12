<template>
    <div class="field">
        <label class="label">{{label}}</label>
        <div class="control has-icons-left">
            <input class="input" :type="type"
                   :placeholder="placeholder || label" v-model="data.value">
            <span class="icon is-small is-left">
                <fa-icon :icon="icon"/>
            </span>
        </div>
    </div>
</template>

<script>
    export default {
        props:["label", "type", "placeholder", "data", "icon"]
    }
</script>
