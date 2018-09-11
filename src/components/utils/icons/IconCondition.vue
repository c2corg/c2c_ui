<template>
    <base-icon v-if="this.condition" iconClass="fas fa-circle" :class="'icon-condition-' + this.condition" />
    <base-icon v-else iconClass="far fa-circle" />
</template>

<script>
    export default {
        props: ['condition'],
    }
</script>

<style scoped>

.icon-condition-excellent{
    color:green;
}

.icon-condition-good{
    color:#9ACD32;
}

.icon-condition-average{
    color:yellow;
}

.icon-condition-poor{
    color:red;
}

.icon-condition-awful{
    color:#8B0000;
}

</style>
