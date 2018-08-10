<template>
    <div>
        <label v-if="label">
            <span>{{label}}</span>
        </label>
        <slot></slot>
    </div>
</template>

<script>
    export default {
        props : ['label']
    }
</script>
