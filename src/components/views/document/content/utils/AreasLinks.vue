<template>
    <span v-if="areas.length">
        <icon-area/>
        <span  v-for="area of areas" :key="area.document_id" class="area-link">
            <document-link :document="area" />
            </document-link>
        </span>
    </span>
</template>

<script>
    export default {
        props : ["areas"]
    }
</script>

<style scoped>

.area-link:nth-child(2)::before{
    content:"\00a0"; /*set a space between icon and first element*/
}
.area-link:not(:last-child)::after{
    content:" \2022 "; /* \2022 is bull */
}

</style>
