<template>
    <modal-card ref="modalCard">
        <div slot="title">
            <p>
                {{ title }}
            </p>
            <p class="buttons">
                <button
                    class="button"
                    v-for="(_, otherLang) in $language.available"
                    :key="otherLang"
                    :class="{'is-primary': otherLang==lang}"
                    @click="lang = otherLang">
                    {{ otherLang }}
                </button>
                <a v-if="helper.documentId" :href="'https://www.camptocamp.org/articles/' + helper.documentId">
                    Got to article
                </a>
            </p>
        </div>
        <!-- eslint-disable-next-line vue/no-v-html -->
        <section class="content" v-html="html">
            <!-- <runtime-template :template="'<div>' + html + '</div>'" /> -->
        </section>

        <div slot="footer">
            <button class="button is-primary" @click="$refs.modalCard.hide()" v-translate>
                Close
            </button>
        </div>
    </modal-card>
</template>

<script>
    import axios from 'axios'
    import c2c from '@/js/apis/c2c'

    export default {

        data() {
            return {
                title: null,
                html: null,
                lang: null,
                helper: {},
            }
        },

        watch: {
            lang: "load"
        },

        created(){
            this.lang = this.$language.current
        },

        methods: {
            show(helperId) {
                this.helper = this.getHelper(helperId)
                this.load()
            },

            load(){

                const githubUrl = 'https://raw.githubusercontent.com/c2corg/v6_ui/master/'
                const path = 'c2corg_ui/static/partials/contexthelp/'

                this.title = this.helper.title
                this.html = this.$gettext('loading')

                if (this.helper.documentId) {
                    c2c.article.getCooked(this.helper.documentId, this.lang).then(response => {
                        this.computeHtml2(this.helper, response.data.cooked)
                    })
                } else if (this.helper.url) {
                    axios.get(`${githubUrl}${path}${this.helper.url}`)
                        .then(response => {
                            this.computeHtml(response.data)
                        })
                } else {
                    this.computeHtml(`<div translate>${this.helper.content}</div>`)
                }

                this.$refs.modalCard.show()
            },

            computeHtml(html) {
                const translate = function(node) {
                    if (node.attributes) {
                        if (node.attributes['translate']) {
                            node.innerText = this.$gettext(node.innerText)
                        } else {
                            for (let child of node.childNodes) {
                                translate(child)
                            }
                        }
                    }
                }.bind(this)

                let content = document.createElement('div')
                content.innerHTML = html

                translate(content)

                this.html = content.innerHTML
            },

            computeHtml2(helper, cooked) {
                let content = document.createElement('div')
                content.innerHTML = cooked.description

                if (helper.anchor) {
                    const html = []
                    let appending = false
                    let mainNodeTag = null

                    for (let node of content.children) {

                        // appending at the begining, because we do not want the main title in html
                        if (appending) {
                            html.push(node.outerHTML)
                        }

                        if (node.nodeName.match(/^[hH]\d$/)) {
                            if (!appending) {
                                if (node.id === helper.anchor) {
                                    appending = true
                                    mainNodeTag = node.nodeName
                                    this.title = node.innerHTML
                                }
                            } else if (node.nodeName <= mainNodeTag) {
                                appending = false
                            }
                        }
                    }
                    this.html = html.length !== 0 ? html.join('\n') : content.innerHTML
                } else {
                    this.html = content.innerHTML
                }
            },

            getHelper(name) {
                const match = name.match(/^(\d+)(#([a-z0-9-]+))?$/)

                if (match) {
                    return {
                        documentId: match[1],
                        anchor: match[3]
                    }
                }

                return {
                    'activities': {
                        title: this.$gettext('activities'),
                        url: 'activities.html'
                    },
                    'Taken routes': {
                        title: this.$gettext('Taken routes'),
                        url: 'associate.html'
                    },
                    'snowshoe_rating': {
                        title: this.$gettext('snowshoe_rating'),
                        url: 'route-snowshoe_rating.html'
                    },
                    'global_rating': {
                        title: this.$gettext('global_rating'),
                        url: 'route-global_rating.html'
                    },
                    'engagement_rating': {
                        title: this.$gettext('engagement_rating'),
                        url: 'route-engagement_rating.html'
                    },
                    'equipment_rating': {
                        title: this.$gettext('equipment_rating'),
                        url: 'route-equipment_rating.html'
                    },
                    'ice_rating': {
                        title: this.$gettext('ice_rating'),
                        url: 'route-ice_rating.html'
                    },
                    'via_ferrata_rating': {
                        title: this.$gettext('via_ferrata_rating'),
                        url: 'route-via_ferrata_rating.html'
                    },
                    'conditions_levels': {
                        title: this.$gettext('conditions_levels'),
                        url: 'outing-conditions_levels.html'
                    },
                    'avalanche_signs': {
                        title: this.$gettext('avalanche_signs'),
                        url: 'outing-avalanche_signs.html'
                    },
                    'frequentation': {
                        title: this.$gettext('frequentation'),
                        url: 'outing-frequentation.html'
                    },
                    'route_types': {
                        title: this.$gettext('route_types'),
                        url: 'route-types.html'
                    },
                    'route_configuration_types': {
                        title: this.$gettext('route_configuration_types'),
                        url: 'route-configuration.html'
                    },
                    'elevation_min_max': {
                        title: this.$gettext('elevation'),
                        url: 'route-elevation_min_max.html'
                    },

                    'height_diff_down': {
                        title: this.$gettext('height_diff_down'),
                        content: 'Cumulated negative elevation gain. This includes potential descents on the route to the summit.'
                    },

                    // TODO : ca ne devrait pas être ce fichier
                    'height_diff_up': {
                        title: this.$gettext('height_diff_up'),
                        url: 'route-elevation_min_max.html'
                    },
                    'ski_rating': {
                        title: this.$gettext('ski_rating'),
                        url: 'route-ski_rating.html'
                    },
                    'labande_ski_rating': {
                        title: this.$gettext('labande_ski_rating'),
                        url: 'route-labande_ski_rating.html'
                    },
                    'labande_global_rating': {
                        title: this.$gettext('labande_global_rating'),
                        url: 'route-labande_global_rating.html'
                    },
                    'mixed_rating': {
                        title: this.$gettext('mixed_rating'),
                        url: 'route-mixed_rating.html'
                    },
                    'risk_rating': {
                        title: this.$gettext('risk_rating'),
                        url: 'route-risk_rating.html'
                    },
                    'hiking_rating': {
                        title: this.$gettext('hiking_rating'),
                        url: 'route-hiking_rating.html'
                    },
                    'mtb_down_rating': {
                        title: this.$gettext('mtb_down_rating'),
                        url: 'route-mtb_down_rating.html'
                    },
                    'mtb_up_rating': {
                        title: this.$gettext('mtb_up_rating'),
                        url: 'route-mtb_up_rating.html'
                    },
                    'rock_free_rating': {
                        title: this.$gettext('rock_free_rating'),
                        url: 'route-rock_free_rating.html'
                    },
                    'exposition_rock_rating': {
                        title: this.$gettext('exposition_rock_rating'),
                        url: 'route-exposition_rock_rating.html'
                    },
                    'rock_required_rating': {
                        title: this.$gettext('rock_required_rating'),
                        url: 'route-rock_required_rating.html'
                    },
                    'aid_rating': {
                        title: this.$gettext('aid_rating'),
                        url: 'route-aid_rating.html'
                    },
                    'ski_exposition': {
                        title: this.$gettext('ski_exposition'),
                        url: 'route-ski_exposition.html'
                    },
                    'hiking_mtb_exposition': {
                        title: this.$gettext('hiking_mtb_exposition'),
                        url: 'route-hiking_mtb_exposition.html'
                    },
                    'specific gear': {
                        title: this.$gettext('specific gear'),
                        url: 'route-specific_gear.html'
                    },
                    'author_status': {
                        title: this.$gettext('author_status'),
                        url: 'xreport-author_status.html'
                    },
                    'safety': {
                        title: this.$gettext('safety'),
                        url: 'xreport-safety.html'
                    },
                    'reduce_impact': {
                        title: this.$gettext('reduce_impact'),
                        url: 'xreport-reduce_impact.html'
                    },
                    'increase_impact': {
                        title: this.$gettext('increase_impact'),
                        url: 'xreport-increase_impact.html'
                    },
                    'modifications': {
                        title: this.$gettext('modifications'),
                        url: 'xreport-modifications.html'
                    },
                    'orientations': {
                        title: this.$gettext('orientations'),
                        content: "Main facing of the route or of its main difficulties only. Additional information can be added into the 'Remarks' section."
                    },
                    'height_diff_difficulties': {
                        title: this.$gettext('height_diff_difficulties'),
                        content: 'Combined elevation of the main difficulties of a route, for a route where approach is distinguished from the route itself. Do not mix up with the difficulties length: difficulties height is always lower.'
                    },
                    'condition_rating': {
                        title: this.$gettext('condition_rating'),
                        content: 'Global judgment on the conditions encountered on the route during the outing. This criterion can be used to filter outings. The <i>Conditions</i> field allows to fill in additional information.'
                    },
                    'elevation_up_snow': {
                        title: this.$gettext('elevation_up_snow'),
                        content: 'Elevation at which skis were put on, on the way up. The <i>Conditions</i> field allows to fill in additional information.'
                    },
                    'elevation_down_snow': {
                        title: this.$gettext('elevation_down_snow'),
                        content: 'Elevation at which skis were taken off, on the way down. The <i>Conditions</i> field allows to fill in additional information.'
                    },
                    'glacier_rating': {
                        title: this.$gettext('glacier_rating'),
                        content: 'Condition of the glacier followed by the route: covered and easy to cross, delicate but travel is possible, open and difficult to cross or clearly imposible to cross. The <i>Conditions</i> field allows to fill in additional information.'
                    },
                    'associated_participants': {
                        title: this.$gettext('associated_participants'),
                        content: 'Registered participants can be directly associated to the outing, thus allowing them to modify the outing, add pictures, and associate other registered participants.'
                    },
                    'participants': {
                        title: this.$gettext('participants'),
                        content: 'List of participants to the outing who are not registered users on the website.'
                    },
                    'height_diff_access': {
                        title: this.$gettext('height_diff_access'),
                        content: 'Combined elevation of the approach of a route, for a route where approach is distinguished from the route itself. The approach height is calculated from minimum altitude and altitude where difficulties start.'
                    },
                    'difficulties_height': {
                        title: this.$gettext('difficulties_height'),
                        content: 'Altitude of the base of the route, for an itinerary with a clear distinction between an approach and a route proper. This field should not be used for itineraries where an approach and a route cannot be distinguished.'
                    },
                    'event_type': {
                        title: this.$gettext('event_type'),
                        content: "Type of the occurred or potentially resulting event. More than one type may be selected. 'fall while roped' must be used to clarify 'avalanche', 'fall of a person or roped party' and 'fall in a crevasse', but cannot be selected alone."
                    },
                    'nb_impacted': {
                        title: this.$gettext('nb_impacted'),
                        content: 'Number of impacted persons. If no accident occurred or if no one has fallen, was buried or injured, put 0.'
                    },
                    'severity': {
                        title: this.$gettext('severity'),
                        content: 'Have the impacted persons been injured and forced to temporarily cease the activity performed during this outing?'
                    },
                    'rescue': {
                        title: this.$gettext('rescue'),
                        content: 'Has the event required a rescue service?'
                    },
                    'avalanche_level': {
                        title: this.$gettext('avalanche_level'),
                        content: "Avalanche danger level coming from the avalanche bulletin at the place and time of the event (the avalanche bulletin may indicate a different level depending on the altitude, orientation and time). If there is no avalanche bulletin or it did not mention an avalanche danger level, select 'unavailable'."
                    },
                    'avalanche_slope': {
                        title: this.$gettext('avalanche_slope'),
                        content: 'Slope of the steepest part of the start zone of the avalanche.'
                    },
                    'autonomy': {
                        title: this.$gettext('autonomy'),
                        content: 'Autonomy for practising this activity.'
                    },
                    'users': {
                        title: this.$gettext('associated_participants'),
                        content: this.$gettext('Registered participants can be directly associated to the outing, thus allowing them to modify the outing, add pictures, and associate other registered participants.')
                    },
                    'routes': {
                        title: this.$gettext('Taken routes'),
                        url: 'associate.html'
                    }
                }[name]
            }
        }
    }
</script>
