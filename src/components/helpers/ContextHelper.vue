<template>
    <modal-card ref="modalCard">
        <section class="content">
            <!-- TODO XHR
            https://github.com/c2corg/v6_ui/tree/master/c2corg_ui/static/partials/contexthelp<name>.html -->
        </section>
    </modal-card>
</template>

<script>

    export default {

        props: {
            name:{
                type:String,
                required:true,
            }
        },

        methods:{
            show(){
                this.$refs.modalCard.show()
            }
        }
    }
</script>
