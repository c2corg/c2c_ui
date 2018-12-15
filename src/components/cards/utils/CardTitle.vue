<template>
    <header class="card-header">
        <p class="card-header-title">
            <slot>A very long header that should be ellipsed</slot>
        </p>
    </header>
</template>

<style scoped lang="scss">

@import '@/assets/sass/variables.scss';

.card-header-title {
    padding:0.4rem 0.8rem;
    display:block;
    min-width: 0;
    color:$text;

    align-items: center;
    justify-content: space-between;
    display:flex;
}

</style>
