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

        created() {
            let self = this;

            // TODO remove listener

            window.addEventListener('click', function(e){
                // close dropdown when clicked outside
                if (!self.$el.contains(e.target)){
                    self.isActive = false
                }
            })
        },
    }
</script>

<style scoped>
.dropdown-content{
    padding:1rem;
}
</style>
