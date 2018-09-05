<template>
    <div class="content">
        <span>{{document.event_type}}</span>

        <card-region-item :document="document"/>

        <br>

        <span v-if="document.elevation">
            <i class="fas fa-bomb"/>
            {{document.elevation}}&nbsp;m
        </span>

        <br>

        <activities :activities="document.activities"/>

        <span>
            {{document.date}}
        </span>

        <icon-quality :quality="document.quality"/>

    </div>
</template>

<script>

    import CardRegionItem from '@/components/cards/utils/CardRegionItem'

    export default {
        components: {
            CardRegionItem
        },

        props: ['document'],
    }
</script>
