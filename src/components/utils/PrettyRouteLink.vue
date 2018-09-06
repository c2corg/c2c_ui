<template>
    <div>
        <activities :activities="route.activities"/>
        <document-link :document="route"/>
        <route-rating :route="route"/>
        <span v-if="showArea">
            <em v-for="area in route.areas" :key="area.document_id"
                v-if="area.area_type=='range'">
                &hairsp;&bull;&hairsp;
                <small>
                    <document-title :document="area"/>
                </small>
            </em>
        </span>
    </div>
</template>

<script>

    export default {
        props: ['route', 'showArea'],
    }
</script>
