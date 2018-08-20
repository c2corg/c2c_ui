<template>
    <section>
        <header>
            <slot name="header"></slot>
        </header>
        <main>
            <slot></slot>
        </main>
    </section>
</template>

<style scoped>
    header{
        background:lightgreen;
        padding-left:1rem;
        font-size:150%;
    }

    section{
        border:1px solid red;
        margin-bottom: 2rem;

    }

    main{
        padding:1rem;
    }

</style>
