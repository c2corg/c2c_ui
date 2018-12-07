import showdown from 'showdown'
import config from '@/js/config.js'

var ltag_memory = { L: 0, R: 0 }

showdown.extension('c2c_folies', function() {
    var toc = { // trash
        type: 'lang',
        regex: /(\[\/?(toc2|p|toc)([a-zA-Z_\d ]*)?\/?\])/g,
        replace: function() {
            return ''
        }
    }

    var c2c_title = { // trash
        type: 'lang',
        regex: /\n(#+)([^\n#]+)#*(.*)/g,
        replace: function(match, hashs, title, appendix) {
            if (appendix) {
                appendix = '<small>' + appendix + '</small>'
            }

            return '\n' + hashs + title + appendix
        }
    }

    function image(imgId, options, legend) {
        var size = 'MI'
        var css = ['markdown-image']

        if (options) {
            options = options.split(' ')

            options.forEach(function(option) {
                if (option) {
                    css.push('markdown-image-' + option.replace('_', '-'))
                    size = option === 'big' ? 'BI' : size
                }
            })
        }

        var url = config.urls.api + '/images/proxy/' + imgId + '?size=' + size
        var img = '<img src="' + url + '">'
        var caption = legend ? '<figcaption>' + legend + '</figcaption>' : ''

        return '<figure class="' + css.join(' ') + '"">' + img + caption + '</figure>'
    }

    var img = {
        type: 'lang',
        regex: /\[img=([\d]+|[A-Za-z][\dA-Za-z._/]+)([a-zA-Z\-_ ]*)?\/\]/g,
        replace: function(match, imgId, options) {
            return image(imgId, options)
        }
    }

    var imgLegend = {
        type: 'lang',
        regex: /\[img=([\d]+|[A-Za-z][\dA-Za-z._/]+)([a-zA-Z\-_ ]*)?\]([^[]*)\[\/img\]/g,
        replace: function(match, imgId, options, legend) {
            return image(imgId, options, legend)
        }
    }

    var c2cItem = {
        type: 'lang',
        regex: /\[\[\/?(book|waypoint|route|outing|area|article|map|xreport|image|profile)s\/([\d]+)([^|]*)\|([^\]]*)\]\]/g,
        replace: function(match, item, id, lang, text) {
            if (config.routerMode === 'history') {
                return '<a href="/' + item + 's/' + id + '">' + text + '</a>'
            } else {
                return '<a href="#/' + item + 's/' + id + '">' + text + '</a>'
            }
        }
    }

    var numberStuckToUnit = {
        type: 'lang',
        regex: /\b(\d+ \w)/g,
        replace: function(match, text) {
            return text.replace(/ /g, '&nbsp;')
        }
    }

    // your new best friends :
    // https://regex101.com/
    // http://localhost:3000/markdown
    // http://localhost:3000/article/305462
    // http://localhost:3000/route/57964 thank you Mister Piola for this never ending multi pitch!

    var LtagResult = function() {
        var _this = this

        this.rows = []
        this.cellCount = 1

        this.compute = function() {
            var items = ['\n<table class="markdown-ltag">']

            this.rows.forEach(function(row) {
                items.push('<tr>')

                if (row.cells) {
                    while (row.cells.length < _this.cellCount - 1) {
                        row.cells.push('')
                    }

                    var elt_in = '<' + row.elt + '>'
                    var elt_out = '</' + row.elt + '>'

                    items.push(elt_in, row.cell1.trim(), elt_out)

                    row.cells.forEach(function(cell) {
                        items.push(elt_in, cell.replace('\n', '<br>'), elt_out)
                    })
                } else {
                    items.push("<td colspan='" + _this.cellCount + "'>" + row.cell1 + '</td>')
                }

                items.push('</tr>')
            })

            items.push('</table>')
            return items.join('')
        }

        this.pushLine = function(elt, cell1, cells) {
            // remove last empty cells
            if (cells && cells.length) {
                while (!cells[cells.length - 1] && cells.length > 0) {
                    cells.splice(-1, 1)
                }

                this.cellCount = Math.max(this.cellCount, cells.length + 1)
            }

            _this.rows.push({
                elt: elt,
                cell1: cell1,
                cells: cells
            })
        }
    }

    var ltag = {
        type: 'lang',
        regex: /(?:(?:\n\n?)[LR]#[^]*?(?=\n[LR]#|\n\n))+/gm,
        replace: function() {
            arguments[0] = arguments[0] + '\n\n'

            var row_parser = /(?:\n\n?)([LR])#([^]*?(?=\n[LR]#|\n\n))/gm
            var row_sub_parser = /(=|~|[^|: =]*) *(\|\||\||::|:)?([^]*)/
            var cell_parser = /([^]*?)(?:\|)/g

            var result = new LtagResult()

            do {
                var row_match = row_parser.exec(arguments[0])

                if (row_match) {
                    var tag = row_match[1]
                    var row_parts = row_sub_parser.exec(row_match[2])
                    var suffix = row_parts[1]
                    var cells_str = row_parts[3]

                    cells_str = cells_str.trim() + '|'
                    var cells = []

                    do {
                        var cell_match = cell_parser.exec(cells_str)
                        if (cell_match) {
                            cells.push(cell_match[1].trim())
                        }
                    } while (cell_match)

                    processCells(result, tag, suffix, cells)
                }
            } while (row_match)

            return result.compute()
        }
    }

    var processCells = function(result, tag, suffix, cells) {
        if (suffix.startsWith('~')) {
            result.pushLine('td', cells[0])
        } else if (suffix.startsWith('=')) {
            result.pushLine('th', '', cells)
        } else {
            var suffix_parser = /^([\d]*)([^\d\-+!][^ !]*)?(-[\d]+)?$/
            var suffix_data = suffix_parser.exec(suffix)

            if (suffix_data) {
                var fixed_number = suffix_data[1] // <number> or +<number>
                var label = suffix_data[2] || '' // whatever without spaces, and not starting with number nor  _-+!
                var group_number = suffix_data[3] // -<+>?<number>

                var number = ltag_memory[tag]

                /// //////////////////////////////////////////////////////////////////////////////////////////
                // <number> or +<number>
                if (!fixed_number) {
                    // +1
                    number += 1
                } else {
                    //  number : set to it
                    number = parseInt(fixed_number)
                }

                var number2 = number

                if (group_number) { // several pitchs on one row
                    group_number = group_number.substring(1)
                    number2 = parseInt(group_number)
                }

                // build final label
                var cell1 = tag + number + (number2 !== number ? '-' + number2 : '') + label

                result.pushLine('td', cell1, cells)

                ltag_memory[tag] = number2
            }
        }
    }

    var video = {
        type: 'lang',
        regex: /\[video\](.*?)\[\/video\]/g,
        replace: function(match, url) {
            if (url.includes('vimeo.com')) {
                url = url.replace('vimeo.com', 'player.vimeo.com/video')
                return '<iframe src="' + url + '" width="640" height="360" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>'
            }

            return match
        }
    }

    return [c2c_title, video, img, imgLegend, c2cItem, toc, ltag, numberStuckToUnit]
})

var converter = new showdown.Converter({
    simpleLineBreaks: true,
    headerLevelStart: 2,
    simplifiedAutoLink: true,
    extensions: ['c2c_folies']
})

const convert = function(markdown) {
    ltag_memory.R = 0
    ltag_memory.L = 0
    return converter.makeHtml(markdown)
}

const notMarkdown = new Set(['lang', 'version', 'title', 'slope', 'conditions_levels', 'topic_id', 'participants'])

export const cook_object = function(object) {
    const result = {}

    for (let property of Object.keys(object)) {
        if (object[property] && !notMarkdown.has(property)) {
            result[property] = convert(object[property])
        } else {
            result[property] = object[property]
        }
    }

    return result
}

const cook_locale = function(document, locales, lang) {
    if (locales[lang] === undefined) {
        return false
    }

    document.cooked = cook_object(locales[lang])

    return true
}

export function cook_document(document, prefered_lang) {
    var locales = {}

    for (let locale of document.locales) {
        locales[locale.lang] = locale
    }

    if (!cook_locale(document, locales, prefered_lang)) {
        const langs_priority = ['fr', 'en', 'it', 'de', 'es', 'ca', 'eu']

        for (let lang of langs_priority) {
            if (cook_locale(document, locales, lang)) {
                break
            }
        }
    }
}
