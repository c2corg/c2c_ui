<template>
    <div class="dropdown" :class="activeClass">

        <div class="dropdown-trigger">
            <button class="button" aria-haspopup="true" aria-controls="dropdown-menu" @click="isActive=!isActive">
                <span>{{label}}</span>
                <span class="icon is-small">
                    <i class="fas fa-angle-down" aria-hidden="true"></i>
                </span>
            </button>
        </div>

        <div class="dropdown-menu" id="dropdown-menu" role="menu">
            <div class="dropdown-content">
                <div class="dropdown-item">
                    <slot></slot>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
    export default {
        props : ["label"],
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

        computed:{
            activeClass(){
                return this.isActive ? "is-active" : undefined
            }
        },

        watch:{
            isActive(){
                this.$emit("changeDisplay")
            }
        }
    }
</script>
