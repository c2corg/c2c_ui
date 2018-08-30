<template>
    <div class="card-content">
        <div class="content">

            <card-region-item :document="document"/>

            <br>

            <span>{{document.code}}</span>
            -
            <span>{{document.editor}}</span>

        </div>
    </div>
</template>

<script>
    import CardRegionItem from '@/components/cards/utils/CardRegionItem'

    export default {
        props: ['document'],
        components : {
            CardRegionItem,
        }
    }
</script>
