<template>
    <div class="tab-view">
        <div class="tabs is-centered is-large is-boxed is-fullwidth">
            <ul>
                <li
                    v-for="(tab, i) in tabs"
                    :key="i"
                    v-show="tab.visible"
                    :class="{'is-active':tab.isActive}">
                    <a @click="selectTab(tab)">
                        <span class="is-first-letter-uppercase" :class="{'has-text-danger':tab.hasError}">
                            {{ tab.title }}
                        </span>
                    </a>
                </li>
            </ul>
        </div>
        <slot/>
    </div>
</template>

<script>
    export default {
        data(){
            return {
                tabs:[],
            }
        },

        mounted() {
             this.tabs = this.$children;

             for(let tab of this.tabs){
                 tab.isActive=false
             }
    
             this.tabs[0].isActive=true
        },

        methods:{
            selectTab(tab){
                if(tab.isActive){
                    return
                }

                for(let item of this.tabs){
                    if(item.isActive){
                        item.isActive = false
                        break
                    }
                }

                tab.isActive = true
            }
        },
    }
</script>

<style scoped>

.tab-view{
    padding-bottom:1rem;
    border-bottom:1px solid #dbdbdb;
    margin-bottom:1rem;
}

</style>
