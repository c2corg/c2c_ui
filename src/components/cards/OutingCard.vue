<template>
    <card-container :document="notClickable ? null : document">
        <div slot="header" class="level">
            <document-title :document="document" class="is-ellipsed"/>
            <marker-condition :condition="document.condition_rating" class="is-pulled-right"/>
        </div>

        <div slot="row1" class="level">
            <card-region-item :document="document" />

            <span class="is-nowrap">
                <fa-icon class="has-text-primary" icon="pen"/>
                {{ document.author.name }}
            </span>
        </div>

        <div slot="row2" class="level">
            <span>
                <fa-icon class="has-text-primary" icon="tachometer-alt"/>
                <outing-rating :document="document"/>
            </span>

            <card-elevation-item :elevation="document.elevation_max" class="is-ellipsed"/>

            <span v-if="document.height_diff_up" :title="$gettext('height_diff_up')">
                <icon-height-diff-up class="has-text-primary"/>
                {{ document.height_diff_up }}&nbsp;m
            </span>
        </div>

        <div slot="row3" class="level">
            <card-activities-item :activities="document.activities"/>

            <span class="has-text-primary is-nowrap">
                <marker-gps-trace v-if="document.geometry.has_geom_detail" />
                <marker-image-count :image-count="document.img_count"/>
            </span>

            <span class="is-nowrap">
                {{ $moment.toLocalizedString(document.date_start, "LL") }}
            </span>

            <marker-quality :quality="document.quality"/>
        </div>
    </card-container>
</template>

<script>

    import { documentCardMixin } from './utils/mixins.js'

    export default {
        mixins: [
            documentCardMixin
        ]
    }
</script>
