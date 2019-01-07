<template>
    <form-row :label="$gettext('quality')" always-visible is-grouped>

        <input-simple v-if="autoComputeQuality && automaticComputationAvailable" :value="$gettext(computedQuality)" disabled/>
        <input-simple v-else :options="$options.quality_types" i18n required v-model="manualQuality"/>

        <div class="control" v-if="automaticComputationAvailable">
            <input-checkbox v-model="autoComputeQuality">
                <span v-translate>Auto-compute quality</span>
            </input-checkbox>
        </div>
    </form-row>
</template>

<script>

    import constants from '@/js/constants'
    import FormRow from './FormRow'

    function hasActivities(doc, activities) {
        for (const activity of activities) {
            if (doc.activities.includes(activity)) {
                return true
            }
        }
        return false
    }

    function hasRouteInfo(doc, locale) {
        return (doc.geometry && doc.geometry.geom_detail) || locale.route_description
    }

    function hasConditionLevel(doc, locale) {
        if (locale.conditions) {
            return true
        }

        if (!locale.conditions_levels) {
            return false
        }

        const level = locale.conditions_levels

        if (level.level_place || level.level_comment || level.level_snow_height_total || level.level_snow_height_soft) {
            return true
        }

        return false
    }

    function hasSnowInfo(doc) {
        return (doc.elevation_up_snow ||
            doc.elevation_down_snow ||
            doc.snow_quantity ||
            doc.snow_quality ||
            doc.length_total ||
            doc.glacier_rating)
    }

    function getImageScore(doc, locale) {
        let score = 0

        score += doc.geometry && doc.geometry.geom ? 1 : 0
        score += doc.activities && doc.activities.length ? 0.5 : 0
        score += doc.categories && doc.categories.length ? 0.5 : 0
        score += doc.associations.waypoints.length || doc.associations.routes.length ? 1 : 0

        score += locale.title ? 1 : 0
        score += locale.description ? 1 : 0

        return score
    }

    function getArticleScore(doc, locale) {
        const description = locale.description || ''

        let score = 0

        score += doc.associations.waypoints.length ? 1 : 0
        score += doc.associations.images.length ? 1 : 0
        score += locale.summary ? 1 : 0
        score += description ? 1 : -1
        score += description.search(/(^|\n)##/g) !== -1 ? 1 : 0 // title
        score += description.search(/\[img=/g) !== -1 ? 1 : 0 // img

        return score
    }

    function getOutingScore(doc, locale) {
        function getSkiScore() {
            let score = 0

            score += hasRouteInfo(doc, locale) ? 0.5 : 0
            score += hasSnowInfo(doc) ? 0.5 : 0

            if (doc.access_condition && doc.access_condition !== 'snowy' && doc.elevation_access) {
                score += 0.5
            } else if (doc.access_condition === 'snowy' && doc.elevation_access && locale.access_comment) {
                score += 0.5
            }

            score += (doc.avalanche_signs !== 'no') && locale.avalanches ? 0.5 : 0

            score += locale.description ? 0.5 : 0
            score += locale.weather ? 0.5 : 0
            score += locale.condition_rating ? 0.5 : 0

            score = hasConditionLevel(doc, locale) ? score + 1 : Math.min(score, 2)

            return score
        }

        function getIceScore() {
            let score = 0

            score += hasRouteInfo(doc, locale) ? 0.5 : 0
            score += doc.condition_rating ? 0.5 : 0
            score += locale.description ? 1 : 0
            score += locale.timing ? 0.5 : 0
            score += locale.weather ? 0.5 : 0
            score = hasConditionLevel(doc, locale) ? score + 1.5 : Math.min(score, 2)

            return score
        }

        function getClimbingScore() {
            let score = 0

            score += hasRouteInfo(doc, locale) ? 0.5 : 0
            score += locale.description ? 1 : 0
            score += locale.timing ? 0.5 : 0
            score += locale.weather ? 0.5 : 0
            score = locale.conditions ? score + 2 : Math.min(score, 2)

            return score
        }

        let skiScore = 0
        let iceScore = 0
        let climbingScore = 0

        if (hasActivities(doc, ['skitouring', 'snowshoeing'])) {
            skiScore = getSkiScore()
        }

        if (hasActivities(doc, ['snow_ice_mixed', 'ice_climbing', 'mountain_climbing'])) {
            iceScore = getIceScore()
        }

        if (hasActivities(doc, ['rock_climbing', 'hiking', 'mountain_biking', 'via_ferrata', 'paragliding', 'slacklining'])) {
            climbingScore = getClimbingScore()
        }

        return Math.max(skiScore, iceScore, climbingScore)
    }

    export default {
        components: { FormRow },

        props: {
            document: {
                type: Object,
                default: null
            }
        },

        data() {
            return {
                autoComputeQuality: true,
                computedQuality: 'empty',
                manualQuality: null
            }
        },

        computed: {
            editedLocale() {
                // in edit mode, there is only one locale
                return this.document ? this.document.locales[0] : null
            },
            automaticComputationAvailable() {
                return ['o', 'c', 'i'].includes(this.document.type)
            }
        },

        watch: {
            document: {
                handler: 'computeQuality',
                deep: true,
                immediate: true
            },
            autoComputeQuality: 'storeQuality',
            manualQuality: 'storeQuality'
        },

        methods: {
            storeQuality() {
                this.document.quality = (this.autoComputeQuality && this.automaticComputationAvailable) ? this.computedQuality : this.manualQuality
            },

            computeQuality() {
                if (!this.document) {
                    return null
                }

                // store orgininal quality
                if (this.manualQuality === null) {
                    this.manualQuality = this.document.quality
                }

                let score = this.document.quality

                if (this.document.type === 'o') {
                    score = getOutingScore(this.document, this.editedLocale)
                } else if (this.document.type === 'c') {
                    score = getArticleScore(this.document, this.editedLocale)
                } else if (this.document.type === 'i') {
                    score = getImageScore(this.document, this.editedLocale)
                }

                if (score < 1) {
                    this.computedQuality = 'empty'
                } else if (score < 2) {
                    this.computedQuality = 'draft'
                } else if (score < 3) {
                    this.computedQuality = 'medium'
                } else if (score < 4) {
                    this.computedQuality = 'fine'
                } else {
                    this.computedQuality = 'great'
                }

                this.storeQuality()
            }
        },

        quality_types: constants.quality_types
    }
</script>
