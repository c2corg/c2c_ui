<template>
    <div class="label-value">
        <span class="label-value-label has-text-weight-bold"><!--
        -->{{ label | uppercaseFirstLetter }}<!--
    --></span>
        <span>
            <slot/>
        </span>
    </div>
</template>

<script>
    export default {
        props: {
            label: {
                type: String,
                required: true
            }
        }
    }
</script>

<style scoped>

.label-value span{
    /*
    // TODO : icon activities is bigger. vertical align, and be careful to other items
    // vertical-align: middle;
    // display: inline-block;
    */
}

.label-value-label:after{
    content:" :\00a0"; /* \00a0 is nbsp */
}
</style>
