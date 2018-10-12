<template>
    <p class="control">
        <a class="button has-text-primary">
            <span v-if="icon" class="icon is-small">
                <fa-icon :icon="icon" />
            </span>
            <span v-if="text">
                {{ text }}
            </span>
        </a>
    </p>
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
            }
        }
    }
</script>
