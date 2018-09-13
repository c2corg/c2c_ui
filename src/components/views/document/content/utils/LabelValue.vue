<template>
    <div class="label-value">
        <span class="label-value-label is-first-letter-uppercase has-text-weight-bold">{{ label }}</span>
        <span>
            <slot/>
        </span>
    </div>
</template>

<script>
    export default {
        props : ['label']
    }
</script>

<style scoped>

.label-value span{
    vertical-align: middle;
    display: inline-block;
}

.label-value-label:after{
    content:" :\00a0"; /* \00a0 is nbsp */
}
</style>
