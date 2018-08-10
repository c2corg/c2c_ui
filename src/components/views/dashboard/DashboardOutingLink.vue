<template>
    <div>
        <span>
            <document-link :document="outing"/>
            &hairsp;&bull;&hairsp;
            <em v-for="area in outing.areas" v-bind:key="area.document_id" v-if="area.area_type=='range'">
                <small>
                    <document-title v-bind:document="area"/>
                </small>
            </em>
        </span>
        <span class="is-pulled-right">
            <i class="fa fa-camera" v-if="outing.img_count!=0"></i>
            &hairsp;
            <ConditionIcon v-bind:condition="outing.condition_rating"></ConditionIcon>
        </span>
    </div>
</template>

<script>
    import ConditionIcon from '@/components/utils/ConditionIcon'
    import DocumentLink from '@/components/utils/DocumentLink'
    import DocumentTitle from '@/components/utils/DocumentTitle'

    export default {
        props: ['outing'],

        components: {
            ConditionIcon,
            DocumentLink,
            DocumentTitle
        }
    }
</script>