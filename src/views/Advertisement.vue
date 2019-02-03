<template>
    <div class="advertisement">
        <div :id="'ads_' + $options.affizId"/>
        <router-link v-if="enableFallback" :to="{name:'serac'}" class="advertisement-fallback">
            <img src="@/assets/img/serac.png">
        </router-link>
    </div>
</template>

<script>
    import config from '@/js/config.ts'

    // https://github.com/c2corg/v6_ui/blob/c9962a6c3bac0670eab732d563f9f480379f84d1/c2corg_ui/static/affiz.html
    let script

    export default {

        data() {
            return {
                enableFallback: false
            }
        },

        watch: {
            $route: 'load'
        },

        mounted() {
            script = document.createElement('script')
            script.type = 'text/javascript'
            document.getElementsByTagName('head')[0].appendChild(script)
            script.addEventListener('error', this.onError)
            script.addEventListener('load', this.onLoad)
            this.load()
        },

        methods: {
            load() {
                const rdads = String(Math.random()).substring(2, 11)
                script.src = `${config.affiz.url}?n=${config.affiz.id}_38888818f6&rdads=${rdads}`
            },

            onError() {
                this.enableFallback = true
            },

            onLoad() {
                this.enableFallback = false
            }
        }
    }
</script>

<style scoped lang="scss">
    .advertisement{
        width: 160px;
        height: 320px;
        position: relative;

        .advertisement-fallback{
            display:block;
            position: aboslute;
            top:0;
            left:0;

            img {
                width: 160px;
                height: 320px;
            }
        }
    }

</style>
