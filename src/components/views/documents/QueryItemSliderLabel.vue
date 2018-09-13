<template>
    <div>
        <div class="level is-mobile"> <!--level must be in a single element to remove bottim margin : todo remove ugly hack -->
            <span class="level-left">
                <span class="level-item query-bound-value">
                    {{ value[0] }}
                    <span v-if="field.unit">&nbsp;{{ field.unit }}</span>
                </span>
            </span>
            <span class="level-item">
                <span class=" query-label is-first-letter-uppercase">
                    {{ field.label }}
                </span>
            </span>
            <span class="level-right">
                <span class="level-item query-bound-value">
                    {{ value[1] }}
                    <span v-if="field.unit">&nbsp;{{ field.unit }}</span>
                </span>
            </span>
        </div >
    </div>

</template>

<script>
    export default{
        props:["field", "value"]
    }
</script>


<style scoped>


.query-label{
    font-style:italic;
}

.query-bound-value{
    font-weight:bold;
}

</style>
