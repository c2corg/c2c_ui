<template>
    <information-item :label="label" v-if="content">
        {{content}}&#8239;m
    </information-item>
</template>

<script>
    import InformationItem from '@/components/views/document/utils/InformationItem'

    export default {
        props : ['label', 'content'],

        components: {
            InformationItem
        }
    }
</script>
