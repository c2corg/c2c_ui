<template>

    <fa-layers class="fa-lg" @click="$emit('click')" :class="{'hidden-button':!visible}">
        <fa-icon icon="plus-circle" />
    </fa-layers>

</template>

<script>
    export default {
        props: {
            visible: {
                type: Boolean,
                default: true,
            }
        }
    }

</script>

<style scoped lang="scss">

@import "~bulma/sass/utilities/initial-variables.sass";


div{
    cursor:pointer;
    color:$green;
    transition:300ms;

    svg{
        transition:300ms;
    }
}

.hidden-button{
    width: 0;
    height: 0;
    svg{
        font-size:0;
    }
}

</style>
