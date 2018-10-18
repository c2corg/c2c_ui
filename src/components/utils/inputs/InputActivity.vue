<template>
    <div class="control" :class="{'has-error':hasError}">
        <span v-for="activity of activities" :key="activity"
              :class="{'selected':value_.includes(activity)}"
              class="input-item"
              v-tooltip="$gettext(activity)"
              @click="toggle(activity)">
            <icon-activity :activity="activity" />
        </span>
    </div>
</template>

<script>
    import constants from "@/js/constants.js"
    import { baseMixin, arrayMixin } from "./mixins.js"

    export default {
        mixins: [ baseMixin, arrayMixin ],

        data(){
            return {
                activities: constants.activities,
            }
        },
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
.selected{
    color:$primary;
}
.has-error{
    box-shadow: 0px 0px 8px 0px $danger;
    // border: 1px solid $danger;
}
</style>
