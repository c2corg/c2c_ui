/*
 * This module manipulate document objects
 * it does not provide any API service
 */

import constants from '@/js/constants'

// we need to use a VM, because we need access to Vue.$user.lang

export default function install(Vue) {
    Vue.prototype.$documentUtils = new Vue({
        methods: {
            getDocumentType(letterType) {
                return constants.letterToDocumentType[letterType]
            },

            getDocumentTitle(document, lang) {
                if (document.type === 'u' || !document.type) {
                    return document.name
                }

                var locale = this.$documentUtils.getLocaleSmart(document, lang)

                if (locale.title_prefix) {
                    return locale.title_prefix + ' : ' + locale.title
                }

                return locale.title
            },

            getLocaleStupid(document, lang) {
                if (!document.locales) {
                    return null
                }

                for (let result of document.locales) {
                    if (result.lang === lang) {
                        return result
                    }
                }

                return null
            },

            getLocaleSmart(document, lang) {
                // first of all try to search asked lang
                var result = lang ? this.$documentUtils.getLocaleStupid(document, lang) : null

                if (result) {
                    return result
                }

                // else, search user lang
                result = this.$documentUtils.getLocaleStupid(document, this.$user.lang)
                if (result) {
                    return result
                }

                // else try langs by order
                for (let lang of constants.langs) {
                    result = this.$documentUtils.getLocaleStupid(document, lang)
                    if (result) {
                        return result
                    }
                }

                // should never happen
                return null
            },

            hasRating(document) {
                return document.global_rating ||
                    document.rock_free_rating ||
                    document.rock_required_rating ||
                    document.aid_rating ||
                    document.engagement_rating ||
                    document.risk_rating ||
                    document.equipment_rating ||
                    document.exposition_rock_rating ||
                    document.ice_rating ||
                    document.mixed_rating ||
                    document.ski_rating ||
                    document.hiking_rating ||
                    document.mtb_up_rating ||
                    document.mtb_down_rating ||
                    document.hiking_mtb_exposition
            },

            getAssociationArrayName(child) {
                const documentType = this.getDocumentType(child.type)
                return documentType === 'profile' ? 'users' : documentType + 's'
            },

            isInArray(array, document) {
                return array.filter(item => item.document_id === document.document_id).length !== 0
            },

            addAssociation(document, child) {
                const array = document.associations[this.getAssociationArrayName(child)]

                if (this.isInArray(array, child)) {
                    return
                }

                array.push(child)
                this.propagateAssociationProperties(document, child)
            },

            removeAssociation(document, child) {
                const arrayName = this.getAssociationArrayName(child)
                const array = document.associations[arrayName]

                document.associations[arrayName] = array.filter(item => item.document_id !== child.document_id)
            },

            propagateAssociationProperties(parent, child) {
                // propagate route property to outing
                if (parent.type !== 'o' || child.type !== 'r') {
                    return
                }

                let route = child
                let outing = parent

                for (let activity of route.activities) {
                    if (!outing.activities.includes(activity)) {
                        outing.activities.push(activity)
                    }
                }

                outing.geometry.geom = outing.geometry.geom === null ? route.geometry.geom : outing.geometry.geom

                const names = [
                    'elevation_min',
                    'elevation_max',

                    'height_diff_down',
                    'height_diff_up',

                    'height_diff_difficulties',

                    'global_rating',
                    'engagement_rating',
                    'equipment_rating',
                    'rock_free_rating',

                    'ice_rating',

                    'labande_global_rating',
                    'ski_rating',
                    'snowshoe_rating',
                    'hiking_rating',

                    'via_ferrata_rating',

                    'mtb_down_rating',
                    'mtb_up_rating'
                ]

                names.forEach((name) => {
                    outing[name] = outing[name] === null ? route[name] : outing[name]
                })

                if (!outing.locales[0].title) {
                    outing.locales[0].title = this.getDocumentTitle(route, outing.locales[0].lang)
                }
            },

            buildLocale(documentType, lang) {
                var def = constants.objectDefinitions[documentType]

                var result = {}

                for (let field of Object.values(def.fields)) {
                    if (field.parent === 'locales') {
                        result[field.name] = field.multiple ? [] : null
                    }
                }

                result.lang = lang

                return result
            },

            buildDocument(documentType, lang) {
                var def = constants.objectDefinitions[documentType]

                var result = {
                    type: def.letter,
                    locales: [
                        this.buildLocale(documentType, lang)
                    ],
                    associations: {}
                }

                for (let field of Object.values(def.fields)) {
                    if (field.parent === 'document') {
                        result[field.name] = field.multiple ? [] : null

                        if (field.default) {
                            result[field.name] = field.default
                        }
                    } else if (field.parent === 'associations') {
                        result.associations[(field.documentType === 'profile' ? 'user' : field.documentType) + 's'] = []
                    }
                }

                if (def.geoLocalized) {
                    result.geometry = {
                        geom: null,
                        geom_detail: null
                    }
                }

                return result
            },

            getSortedAreaList(document) {
                let areas = document.areas
                let sortedAreas = []

                if (areas) {
                    // the areas often come in different orders within 3 area objects.
                    const orderedAreas = { 'range': [], 'admin_limits': [], 'country': [] }

                    for (let area of areas) {
                        orderedAreas[area.area_type].push(this.getLocaleSmart(area).title)
                    }

                    if (orderedAreas['range'].length) {
                        sortedAreas = sortedAreas.concat(orderedAreas['range'])
                    }

                    if (orderedAreas['admin_limits'].length) {
                        sortedAreas = sortedAreas.concat(orderedAreas['admin_limits'])
                    }

                    if (orderedAreas['country'].length) {
                        sortedAreas = sortedAreas.concat(orderedAreas['country'])
                    }
                }

                return sortedAreas.join(' - ')
            }
        }
    })
}
