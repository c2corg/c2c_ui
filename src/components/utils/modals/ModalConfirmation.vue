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
        </div>
        <div slot="footer">
            <button
                @click="$emit('confirm')"
                class="button is-danger">
                <slot name="confirm-label">
                    <span v-translate>
                        Confirm
                    </span>
                </slot>
            </button>
            <button
                @click="$refs.modalWindow.hide()"
                class="button is-success"
                v-translate>
                Cancel
            </button>
        </div>
    </modal-card>

</template>

<script>

export default {
    props:{
        showUncancelableWarning:{
            type:Boolean,
            default:false,
        }
    },

    methods:{
        show(){
            this.$refs.modalWindow.show()
        },
        hide(){
            this.$refs.modalWindow.hide()
        }
    }
}

</script>
