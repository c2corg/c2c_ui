<template>
    <a
        class="button has-text-primary"
        :disabled="disabled"
        :title="tooltip"
        :target="target"
        :href="href"
        @click="!disabled ? $emit('click', arguments[0]) : {}">
        <span v-if="icon" class="icon">
            <fa-icon :icon="icon" />
        </span>
        <span v-if="text">
            {{ text }}
        </span>
    </a>
</template>

<script>
    export default {
        props: {
            text: {
                type: String,
                default: null
            },
            icon: {
                type: String,
                default: null
            },
            tooltip: {
                type: String,
                default: null
            },
            disabled: {
                type: Boolean,
                default: false
            },
            target: {
                type: String,
                default: null
            },
            href: {
                type: String,
                default: null
            }
        }
    }
</script>
