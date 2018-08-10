<template>
    <div>
        <ConditionIcon v-bind:condition="outing.condition_rating"></ConditionIcon>
        {{outing.date_start}}
        :
        <document-link :document="outing"/>
        &hairsp;&bull;&hairsp;
        <router-link :to="{name:'profile', params:{id:outing.author.user_id}}">
            {{outing.author.name}}
        </router-link>
        <span  v-if="outing.img_count!=0">
            &hairsp;&bull;&hairsp;
            <i class="fa fa-camera"></i>
        </span>
    </div>
</template>

<script>
    import ConditionIcon from '@/components/utils/ConditionIcon'
    import DocumentLink from '@/components/utils/DocumentLink'

    export default {
        props: ['outing'],

        components: {
            ConditionIcon,
            DocumentLink,
        }
    }
</script>