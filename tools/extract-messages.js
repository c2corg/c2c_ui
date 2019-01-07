/*****************************************
Extract untranslated string from .vue and .js files
and save them into a .pot file :

https://www.gnu.org/software/gettext/manual/gettext.html

Supported patterns in .vue and .js files :

    $gettext('msgid')
    $gettext('msgid', 'msgctx')

Supported pattern in .vue file, inside <template /> part :

    Any node that contains a v-translate directive.
    translate-context attribute is optional
    node must contains only one text node

    Exemple :

        <span v-translate> Hello </span>
        <span v-translate translate-context="World"> Hello </span>

******************************************/


const fs = require('fs')
const compiler = require('vue-template-compiler')

const NODETYPE_TEXT = 3

const template_regex = /(<template>[\s\S]*<\/template>)/
const gettext_template1 = /\$gettext\('([^']*?)'\)/g
const gettext_template2 = /\$gettext\('([^']*?)', *'([^']*?)'\)/g


/**************************************************************************
  a "Result" is a .pot item (msgctxt/msgid), with every associated meta-data
**************************************************************************/
function Result(msgctxt, msgid) {
    this.msgctxt = msgctxt
    this.msgid = msgid
    this.files = {} // fake hastable
}

Result.prototype.addFile = function(file) {
    this.files[file] = null
}

Result.prototype.toString = function() {
    var result = '#: ' + Object.keys(this.files).sort().join('\n#: ') + '\n'

    result += this.msgctxt ? `msgctxt "${this.msgctxt}"\n` : ''
    result += `msgid "${this.msgid}"\n`
    result += `msgstr ""\n`

    return result
}

function Process() {
    // data is a simple key-value dict, where key
    this.data = {}
}

Process.prototype.push = function(file, msgctxt, msgid) {

    // trim
    msgid = msgid.replace(/^[\r\n\s]*/g, '')
    msgid = msgid.replace(/[\r\n\s]*$/g, '')
    msgid = msgid.replace(/\n/g, ' ')
    msgid = msgid.replace(/\t/g, ' ')
    msgid = msgid.replace(/\s+/g, ' ')

    // keep lower case msgid in first, at's it will be used for sorting
    const key = `${msgid.toLowerCase()}\u0002${msgid}\u0002${msgctxt}`

    if (this.data[key] === undefined) {
        this.data[key] = new Result(msgctxt, msgid)
    }

    this.data[key].addFile(file)
}

Process.prototype.addVueComponent = function(file, data) {
    this.parseTemplate(file, data)
    this.parseScript(file, data, gettext_template1)
    this.parseScript(file, data, gettext_template2)
}


Process.prototype.addScript = function(file, data) {
    this.parseScript(file, data, gettext_template1)
    this.parseScript(file, data, gettext_template2)
}

Process.prototype.parseScript = function(file, data, regex) {
    let msgData

    const lines = data.split("\n")

    for(let i = 0; i<lines.length; i++){
        while ((msgData = regex.exec(lines[i])) !== null) {

            let msgid = msgData[1]
            let msgctxt = msgData[2]

            this.push(`${file}:` + (i+1), msgctxt, msgid)
        }
    }
}

Process.prototype.parseTemplate = function(file, data) {
    // we need line number, but compiler does not provide it.
    // let use a trick : we do not use directive argument, so
    // we will modifiy our script by adding v-translate:N
    // where N is the line number
    data = data.split("\n")
    for(let i = 0; i<data.length; i++){
        data[i] = data[i].replace(/v-translate/g, "v-translate:" + (i+1))
    }
    data = data.join("\n")

    // get template part
    const template = template_regex.exec(data)

    if (template === null) {
        console.log(`${file} has no template`)
        return
    }

    const parseTranslateDirective = function(node, directiveMeta) {
        let line = directiveMeta.arg // the trick: arg is the line number
        let position = file + ":" + line
        let msgctxt = undefined

        if (node.children.length !== 1) {
            throw new Error(`In ${position}\nNodes with v-translate directive must contains only one child`)
        }

        if (node.children[0].type !== NODETYPE_TEXT) {
            throw new Error(`In ${position}\nInterploation is not yet supported. Please use $gettext`)
        }

        for(let attribute of node.attrsList){
            if(attribute.name==='translate-context') {
                msgctxt = attribute.value
            }
        }

        let msgid = node.children[0].text
        this.push(position, msgctxt, msgid)
    }

    compiler.compile(template[1], {
        preserveWhitespace: false,
        directives: {
            translate: parseTranslateDirective.bind(this)
        }
    })
}


Process.prototype.compute = function(file_or_dir) {
    if (fs.statSync(file_or_dir).isDirectory()) {
        let files = fs.readdirSync(file_or_dir)

        for (let file of files) {
            this.compute(file_or_dir + '/' + file)
        }
    } else if (file_or_dir.endsWith('.vue')) {
        let data = fs.readFileSync(file_or_dir, 'utf-8')
        this.addVueComponent(file_or_dir, data)

    } else if (file_or_dir.endsWith('.js')) {
        let data = fs.readFileSync(file_or_dir, 'utf-8')
        this.addScript(file_or_dir, data)
    }
}

Process.prototype.save = function(potFile){

    let result = []

    for (let key of Object.keys(this.data).sort()) {
        result.push(this.data[key].toString())
    }

    fs.writeFileSync(potFile, result.join('\n'))
}

function main(sourceDir, potFile) {

    const process = new Process()

    process.compute(sourceDir)
    process.save(potFile)

    console.log(`Process finished. ${Object.keys(process.data).length} messages extracted`)
}

// If running this module directly then call the main function.
if (require.main === module) {
    main('src', 'src/translations/po/c2corg_ui-client.pot')
}

module.exports = main
