<template>
    <a class="button has-text-primary" v-tooltip="tooltip" @click="$emit('click', arguments[0])">
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
        props : {
            text: {
                type:String,
                default:null
            },
            icon: {
                type:String,
                default:null
            },
            tooltip: {
                type:String,
                default:null
            },
        }
    }
</script>
