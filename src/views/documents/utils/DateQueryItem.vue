<template>
    <div>
        <div class="control">
            <label class="label is-first-letter-uppercase" v-translate>date_start</label>
            <input class="input" type="date" v-model="value[0]">
        </div>
        <div class="control">
            <label class="label is-first-letter-uppercase" v-translate>date_end</label>
            <input class="input" type="date" v-model="value[1]">
        </div>
    </div>
</template>

<script>

    export default {

        data() {
            return {
                value: [null, null]
            }
        },

        computed: {
            urlValue: {
                get() {
                    return (this.$route.query.date || '') + ','
                },
                set(value) {
                    var query = Object.assign({}, this.$route.query)
                    query.date = value

                    if (query.date !== this.$route.query.date) {
                        this.$router.push({ query: query })
                    }
                }
            }
        },

        watch: {
            value: 'compute'
        },

        created() {
            this.value = this.urlValue.split(',')
        },

        methods: {
            compute() {
                if (!this.value[0] && !this.value[1]) {
                    this.urlValue = undefined
                } else {
                    if (!this.value[0] && this.value[1]) {
                        this.value = [this.value[1], this.value[0]]
                    }

                    if (!this.value[1]) {
                        this.urlValue = this.value[0]
                    } else {
                        this.urlValue = this.value[0] + ',' + this.value[1]
                    }
                }
            }
        }
    }
</script>
