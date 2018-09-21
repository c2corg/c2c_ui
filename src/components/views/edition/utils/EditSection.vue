<template>
    <section>
        <header @click="expanded_=!expanded_">
            {{ header }}
            <button class="button is-pulled-right">
                {{ expanded_ ? 'Collapse' : 'Expand' }}
            </button>
        </header>
        <main :class="{expanded:expanded_, hidden:!expanded_}">

            <div class="columns is-multiline">
                <slot/>
            </div>

        </main>
    </section>
</template>

<script>

    export default {

        props : {
            header:{
                type: String,
                required: false,
                default: undefined,
            },
            expanded:{
                type: Boolean,
                required: false,
                default: undefined,
            },
        },

        data(){
            return {
                expanded_:this.expanded,
            }
        }
    }
</script>
<style scoped>


    main.hidden{
        max-height:0;
        overflow: hidden;
    }

    main{
        max-height:9999px;
    }

    main > div {
        padding:1rem;
    }


    header{
        font-size:150%;
        font-weight:bold;
    }

    section{
        border-top:1px solid lightgray;
        padding-top: 1rem;
        padding-bottom: 1rem;

    }

</style>
