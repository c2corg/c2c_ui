<template>
    <div>
        <div class="tabs is-centered is-boxed">
            <ul>
                <li v-for="(tab, i) in tabs" :key="i" :class="{'is-active':tab.isActive}">
                    <a @click="selectTab(tab)">{{ tab.title }}</a>
                </li>
            </ul>
        </div>
        <slot/>
    </div>
</template>

<script>
    export default {
        props : [],

        data(){
            return {
                tabs:[],
            }
        },

        mounted() {
             this.tabs = this.$children;
             this.tabs[0].isActive=true
        },

        methods:{
            selectTab(tab){
                if(tab.isActive){
                    return;
                }

                for(let item of this.tabs){
                    if(item.isActive){
                        item.isActive = false
                        break;
                    }
                }

                tab.isActive = true
            }
        },
    }
</script>