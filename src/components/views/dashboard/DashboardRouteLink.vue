<template>
    <div>
        <span>
            <document-link :document="route"/>
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
    import DocumentLink from '@/components/utils/DocumentLink'
    import DocumentTitle from '@/components/utils/DocumentTitle'

    export default {
        props: ['route'],

        components: {
            DocumentLink,
            DocumentTitle
        }
    }
</script>