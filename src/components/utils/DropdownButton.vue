<template>
    <div class="dropdown" :class="activeClass">

        <div class="dropdown-trigger">
            <button class="button" @click="isActive=!isActive" :disabled="disabled"
                aria-haspopup="true" aria-controls="dropdown-menu" >

                <slot name="button"></slot>

                <span class="icon is-small">
                    <fa-icon icon="angle-down" aria-hidden="true"/>
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
        props : {
            disabled : {
                type : Boolean,
                default : null
            }
        },

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
