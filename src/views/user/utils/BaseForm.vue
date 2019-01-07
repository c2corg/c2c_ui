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
            for (const child of this.$children) {
                this.inputs[child.name] = child
                child.$on('input', this.check)
            }
        },

        methods: {
            computeErrors() {
                if (!this.serverErrors) {
                    return
                }

                const errors = this.serverErrors.errors

                if (!errors) {
                    // TODO unexpected server error
                } else {
                    this.serverMetaErrors = []

                    for (const error of errors) {
                        if (this.inputs[error.name]) {
                            this.inputs[error.name].errorMessage = error.description
                        } else {
                            this.serverMetaErrors.push(error)
                        }
                    }
                }
            },

            check() {
                for (const child of this.$children) {
                    if (child.hasError) {
                        this.hasError = true
                        return
                    }
                }

                this.hasError = false
            },

            submit(event) {
                event.preventDefault()

                this.check() // must recheck, because auto-fill may ont fire good events

                if (this.hasError) {
                    return
                }

                for (const input of Object.values(this.inputs)) {
                    input.errorMessage = null
                }

                this.serverMetaErrors = []

                this.$emit('submit')
            }
        }
    }

</script>
