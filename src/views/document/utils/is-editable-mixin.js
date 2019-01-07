import viewModeMixin from './view-mode-mixin'

export default {
    mixins: [viewModeMixin],

    computed: {
        isEditable() {
            if (!this.$user.isLogged || !this.isNormalView) {
                return false
            }

            if (this.$user.isModerator) {
                return true
            }

            if (['route', 'waypoint', 'area', 'book', 'map'].includes(this.documentType)) {
                return true
            }

            if (this.documentType === 'profile') {
                return this.document.document_id === this.$user.id
            }

            if (this.documentType === 'article') {
                if (this.document.article_type === 'collab') {
                    return true
                }

                return this.document.author.user_id === this.$user.id
            }

            if (['outing', 'xreport'].includes(this.documentType)) {
                for (const user of this.document.associations.users) {
                    if (user.document_id === this.$user.id) {
                        return true
                    }
                }

                return false
            }

            if (this.documentType === 'image') {
                if (this.document.image_type === 'collaborative') {
                    return true
                } else if (['personal', 'copyright'].includes(this.document.image_type)) {
                    return this.document.creator.user_id === this.$user.id
                } else {
                    throw new Error(`Unexpected image_type : ${this.document.image_type}`)
                }
            }

            return false
        }
    }
}
