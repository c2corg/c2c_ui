<template>
    <card-container class="route-card" @click="go">
        <document-title slot="header" :document="document"/>

        <div slot="row1" class="level">
            <card-region-item :document="document" />
            <span class="is-nowrap">
                <icon-forum />
                @{{ document.forum_username }}
            </span>
        </div>

        <div slot="row2" class="level">
            <card-activities-item :activities="document.activities"/>
            &nbsp;

            <textual-array :array="document.categories" class="is-ellipsed"/>
        </div>
    </card-container>
</template>

<script>

    import cardMixins from './utils/mixins.js'

    export default {
        mixins: [
            cardMixins,
        ],
    }
</script>
