<template>
    <div class="card" @click="click">
        <header class="card-header">
            <p class="card-header-title">
                <slot name="header">A very long header that should be ellipsed</slot>
            </p>
        </header>
        <div class="card-content">
            <slot name="row1">Please fill content</slot>
        </div>
        <div v-if="this.$slots.row2" class="card-content">
            <slot name="row2">row2</slot>
        </div>
        <div v-if="this.$slots.row3" class="card-content">
            <slot name="row3">row3</slot>
        </div>
        <div v-if="this.$slots.row4" class="card-content">
            <slot name="row3">row4</slot>
        </div>
    </div>
</template>

<script>
    export default {
        methods:{
            click(){
                this.$emit("click")
            }
        }
    }
</script>

<style scoped lang="scss">

@import '@/assets/sass/variables.scss';

.card{
    transition:0.1s;
    cursor:pointer;
}

.card:hover{
//    background:$white-ter;
    transition:0.2s;
    box-shadow:1px 3px 4px rgba(10, 10, 10, 0.12), 0 0 0 1px rgba(10, 10, 10, 0.1);
}

.card-header-title {
    display:block;
    min-width: 0;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
}

.card-content, .card-header-title{
    padding:0.4rem 0.8rem;
}

.card-content{
    font-size:0.9rem;
}

.card-content:not(:last-child){
    box-shadow:  0 1px 2px rgba(10, 10, 10, 0.1);
}



</style>
