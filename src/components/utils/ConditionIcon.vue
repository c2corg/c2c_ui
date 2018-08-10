<template>
    <span v-if="condition" v-bind:class="'condition-'+condition">
        <i class="fas fa-circle"></i>
    </span>
    <span v-else>
        <i class="far fa-circle"></i>
    </span>
</template>

<script>
    export default {
        props: ['condition'],
    }
</script>

<style>
.condition-excellent{
    color:green;
}

.condition-good{
    color:#9ACD32;
}

.condition-average{
    color:yellow;
}

.condition-poor{
    color:red;
}

.condition-awful{
    color:#8B0000;
}
</style>