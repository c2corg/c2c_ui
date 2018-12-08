<template>
    <!-- Do NOT add tooltip -->
    <div class="control" :class="{'has-error':hasError}">
        <span
            v-for="activity of activities" :key="activity"
            :class="{'selected':value_.includes(activity), 'with-labels' :showLabels }"
            class="input-item"
            :title="showLabels ? null : $gettext(activity)"
            @click="toggle(activity)">
            <icon-activity :activity="activity" />
            <span v-if="showLabels" class="is-size-6 input-label">
                {{ $gettext(activity) }}
            </span>
        </span>
    </div>
</template>

<script>
    import constants from '@/js/constants'
    import { baseMixin, arrayMixin } from './mixins.js'

    export default {
        mixins: [ baseMixin, arrayMixin ],

        props: {
            showLabels: {
                type: Boolean,
                default: false
            }
        },

        computed: {
            activities() {
                return constants.activities
            }
        }
    }
</script>

<style scoped lang="scss">

@import '@/assets/sass/variables.scss';

.input-item {
    cursor:pointer;
    font-size:40px;
    margin:4px;
    color:#888;

}

.with-labels{
    width: 100px;
    display: inline-flex;
    flex-direction: column;

    svg {
        margin:auto
    }

    .input-label{
        text-align: center;
    }
}

.selected{
    color:$primary;
}
.has-error{
    box-shadow: 0px 0px 8px 0px $danger;
    // border: 1px solid $danger;
}
</style>
