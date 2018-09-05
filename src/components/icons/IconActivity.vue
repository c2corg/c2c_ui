<template>
    <base-icon :iconClass="'icon-activity-' + activity"/>
</template>

<script>

    export default {
        props: ['activity'],
    }
</script>
