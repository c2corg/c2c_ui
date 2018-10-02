<template>

    <span @click="$emit('click')" :class="{'hidden-button':!visible}">
        <fa-icon :icon="['far','trash-alt']" />
    </span>

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


span{
    cursor:pointer;
    text-align: center;
    background:$red;
    border-radius:100%;
    color:white;

    width:1.4em;
    height:1.4em;

    transition:300ms;

    svg{
        vertical-align:baseline;
        transition:300ms;
    }
}

.hidden-button{
    width:0;
    height:0;
    margin:0.7em;

    svg{
        opacity:0;
        font-size:0;
    }
}

</style>
