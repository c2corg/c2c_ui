<template>
    <div :class="{'is-active': isActive}" class="dropdown">

        <div class="dropdown-trigger">
            <span
                :disabled="disabled"
                class="button"
                aria-haspopup="true"
                aria-controls="dropdown-menu"
                @click="isActive=(!isActive && !disabled)" >

                <slot name="button"/>

                <span class="icon is-small">
                    <fa-icon icon="angle-down" aria-hidden="true"/>
                </span>
            </span>
        </div>

        <div id="dropdown-menu" class="dropdown-menu" role="menu">
            <div class="dropdown-content">
                <div class="dropdown-item">
                    <slot/>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
    export default {
        props: {
            disabled: {
                type: Boolean,
                default: null
            }
        },

        data() {
            return {
                isActive: false
            }
        },

        watch: {
            isActive() {
                this.$emit('changeDisplay')
            }
        },

        created() {
            window.addEventListener('click', this.onClick)
        },

        beforeDestroy() {
            window.removeEventListener('click', this.onClick)
        },

        methods: {
            onClick(event) {
                // close dropdown when clicked outside
                if (!this.$el.contains(event.target)) {
                    this.isActive = false
                }
            }
        }
    }
</script>
