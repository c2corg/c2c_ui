<template>
    <div class="content-box" @click="click" >
        <slot></slot>
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


// first try : no border, small shadow
.content-box{
//    box-shadow:0 2px 3px rgba(10, 10, 10, 0.10), 0 0 0 1px rgba(10, 10, 10, 0.1);
    background:$white;
//    border-radius:$radius-small;
    padding:1rem;
}

.content-box:not(:last-child){
    margin-bottom:1rem;
}

// second try primary big border top, small shadow
/*
.content-box{
    box-shadow:$card-shadow;
    border-top:4px solid $primary;
    //border-radius:$radius-small;
    background:$card-background-color;
    padding:1rem;
}


.content-box:not(:last-child){
    margin-bottom:1rem;
}*/

</style>
