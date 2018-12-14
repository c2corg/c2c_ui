<template>
    <div class="card">
        <component :is="document ? 'document-link' : 'span'" :document="document">
            <slot />
        </component>
    </div>
</template>

<script>

    export default {
        props: {
            document: {
                type: Object,
                default: null
            }
        }
    }
</script>

<style scoped lang="scss">

@import '@/assets/sass/variables.scss';

.card{
    transition:0.1s;
}

.card:hover{
    transition:0.2s;
    box-shadow:1px 3px 4px rgba(10, 10, 10, 0.12), 0 0 0 1px rgba(10, 10, 10, 0.1);
}

</style>
