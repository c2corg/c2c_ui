<template>
    <modal-card ref="modalWindow">
        <div slot="title">
            <slot name="title" />
        </div>
        <div>

            <div v-if="showUncancelableWarning" class="notification is-warning has-text-centered">
                <strong v-translate>
                    Warning: This action cannot be undone!
                </strong>
            </div>

            <slot />

            <div v-if="promise && promise.error" class="notification is-danger">
                {{ promise.error }}
            </div>

        </div>
        <div slot="footer">
            <button
                @click="$emit('confirm')"
                class="button is-danger"
                :class="{'is-loading':promise && promise.loading}">
                <slot name="confirm-label">
                    <span v-translate>
                        Confirm
                    </span>
                </slot>
            </button>
            <button
                @click="$refs.modalWindow.hide()"
                class="button is-success"
                :disabled="promise && promise.loading"
                v-translate>
                Cancel
            </button>
        </div>
    </modal-card>

</template>

<script>

    export default {
        props: {
            showUncancelableWarning: {
                type: Boolean,
                default: false
            },
            promise: {
                type: Object,
                default: null
            }
        },

        methods: {
            show() {
                this.$refs.modalWindow.show()
            },
            hide() {
                this.$refs.modalWindow.hide()
            }
        }
    }

</script>
