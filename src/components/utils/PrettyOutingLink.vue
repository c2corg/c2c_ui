<template>
    <div>
        <icon-condition v-bind:condition="outing.condition_rating"/>
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
    export default {
        props: ['outing'],
    }
</script>
