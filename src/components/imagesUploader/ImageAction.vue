<template>
    <div class="card-footer-item dropdown" :class="{'is-active': isActive}">
        <a @click="isActive=!isActive" >
            <slot name="button"/>
            <span class="icon">
                <fa-icon icon="angle-down" aria-hidden="true"/>
            </span>
        </a>

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

        created: function() {
            let self = this;

            window.addEventListener('click', function(e){
                // close dropdown when clicked outside
                if (!self.$el.contains(e.target)){
                    self.isActive = false
                }
            })
        },
    }
</script>
