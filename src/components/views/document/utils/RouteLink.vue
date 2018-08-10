<template>
    <div>
        <activities :activities="route.activities"/>
        <document-link :document="route"/>
        <route-rating :route="route"/>
    </div>
</template>

<script>
    import Activities from '@/components/utils/Activities'
    import DocumentLink from '@/components/utils/DocumentLink'
    import RouteRating from '@/components/utils/RouteRating'

    export default {
        props: ['route'],

        components: {
            Activities,
            DocumentLink,
            RouteRating,
        }
    }
</script>