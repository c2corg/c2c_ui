<template>
    <base-icon :iconClass="iconClass" :class="className" />
</template>

<script>
    export default {
        props: ['condition'],
        
        computed:{
            className(){
                return this.condition ? 'icon-condition-' + this.condition : ''
            },
            iconClass(){
                return this.condition ? 'fas fa-circle' : 'far fa-circle'
            }
        }
    }
</script>
