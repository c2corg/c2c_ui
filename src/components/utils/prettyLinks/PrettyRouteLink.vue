<template>
    <span>
        <activities :activities="route.activities"/>
        <document-link :document="route"/>
        <route-rating :document="route"/>
        <span v-if="showArea">
            <em v-for="area in route.areas" v-if="area.area_type=='range'"
                :key="area.document_id">
                &hairsp;&bull;&hairsp;
                <small>
                    <document-title :document="area"/>
                </small>
            </em>
        </span>
    </span>
</template>

<script>

    export default {
        props: {
            route: {
                type:Object,
                required:true,
            },
            showArea: {
                type:Boolean,
                required:false,
                default: false,
            }
        },
    }
</script>
