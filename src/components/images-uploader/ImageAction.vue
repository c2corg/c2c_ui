<template>
    <div class="card-footer-item dropdown is-up" :class="{'is-active': isActive}">
        <a @click="isActive=!isActive" >
            <slot name="button"/>
            <span class="icon">
                <fa-icon icon="angle-down" aria-hidden="true"/>
            </span>
        </a>

        <!-- TODO c'est moche  -->
        <div class="dropdown-menu" role="menu">
            <div class="dropdown-content">
                <slot />
            </div>
        </div>
    </div>
</template>

<script>
    export default {
        data(){
            return {
                isActive:false
            }
        },

        created(){
            window.addEventListener('click', this.onClick)
        },

        beforeDestroy(){
            window.removeEventListener("click", this.onClick)
        },

        methods:{
            onClick(event){
                if (!this.$el.contains(event.target))
                    this.isActive = false
            }
        },
    }
</script>

<style scoped>
.dropdown-content{
    padding:1rem;
}
</style>
