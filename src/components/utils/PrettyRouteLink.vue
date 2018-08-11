<template>
    <div>
        <activities :activities="route.activities"/>
        <document-link :document="route"/>
        <route-rating :route="route"/>
        <span v-if="showArea">
            <em v-if="area.area_type=='range'"
                v-for="area in route.areas"
                v-bind:key="area.document_id">
                &hairsp;&bull;&hairsp;
                <small>
                    <document-title :document="area"/>
                </small>
            </em>
        </span>
    </div>
</template>

<script>
    import Activities from '@/components/utils/Activities'
    import RouteRating from '@/components/utils/RouteRating'

    export default {
        props: ['route', 'showArea'],

        components: {
            Activities,
            RouteRating,
        }
    }
</script>
