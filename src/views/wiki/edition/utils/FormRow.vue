<template>
    <div v-show="visible" class="field is-horizontal">
        <div class="field-label is-normal">
            <label class="label is-first-letter-uppercase">
                <marker-helper :name="helper" />
                {{ label }}
            </label>
        </div>
        <div class="field-body">
            <div
                class="field"
                :class="{
                    'is-grouped is-grouped-multiline':isGrouped,
                    'is-expanded':isExpanded,
                    'is-narrow':isNarrow,}">
                <slot />
            </div>
        </div>
    </div>
</template>

<script>
    export default {
        props: {
            label: {
                type: String,
                default: ''
            },
            alwaysVisible: {
                type: Boolean,
                default: false
            },
            isGrouped: {
                type: Boolean,
                default: false
            },
            isExpanded: {
                type: Boolean,
                default: false
            },
            isNarrow: {
                type: Boolean,
                default: false
            },
            helper: {
                type: String,
                default: undefined
            }
        },

        data() {
            return {
                visible: true,
                hasError: false
            }
        },

        mounted() {
            for (let child of this.$children) {
                child.$watch('visible', this.checkVisibility)
                child.$watch('hasError', this.checkHasError)
            }

            this.checkVisibility()
            this.checkHasError()
        },

        methods: {
            checkVisibility() {
                this.visible = this.alwaysVisible

                for (let child of this.$children) {
                    if (child.visible) {
                        this.visible = this.visible || true
                    }
                }
            },
            checkHasError() {
                this.hasError = false

                for (let child of this.$children) {
                    if (child.hasError === true) {
                        this.hasError = true
                    }
                }
            }
        }
    }
</script>
