<template>
    <form @submit="submit">
        <div v-for="(error,i) of serverMetaErrors" :key="i" class="notification is-danger">
            {{ $gettext(error.description) }}
        </div>

        <slot />
    </form>
</template>

<script>

    export default {

        props: {
            serverErrors: {
                type: Object,
                default: null
            }
        },

        data() {
            return {
                hasError: false,
                inputs: {},
                serverMetaErrors: [] // errors that can't be linked to an input
            }
        },

        watch: {
            serverErrors: 'computeErrors'
        },

        mounted() {
            for (let child of this.$children) {
                this.inputs[child.name] = child
                child.$on('input', this.check)
            }
        },

        methods: {
            computeErrors() {
                if (!this.serverErrors) {
                    return
                }

                let errors = this.serverErrors.errors

                if (!errors) {
                    // TODO unexpected server error
                } else {
                    this.serverMetaErrors = []

                    for (let error of errors) {
                        if (this.inputs[error.name]) {
                            this.inputs[error.name].errorMessage = error.description
                        } else {
                            this.serverMetaErrors.push(error)
                        }
                    }
                }
            },

            check() {
                for (let child of this.$children) {
                    if (child.hasError) {
                        this.hasError = true
                        return
                    }
                }

                this.hasError = false
            },

            submit(event) {
                event.preventDefault()

                if (this.hasError) {
                    return
                }

                for (let input of Object.values(this.inputs)) {
                    input.errorMessage = null
                }

                this.serverMetaErrors = []

                this.$emit('submit')
            }
        }
    }

</script>
