<template>
    <fa-icon v-if="this.condition" icon="circle" :class="'icon-condition-' + this.condition" />
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
