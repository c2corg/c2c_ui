const fs = require('fs');
const compiler = require('vue-template-compiler')
//const Extractor = require('angular-gettext-tools').Extractor;

const NODETYPE_TEXT = 3

const template_regex =  /(<template>[\s\S]*<\/template>)/
const gettext_template1 = /\$gettext\('(.*?)'\)/g
const gettext_template2 = /\$gettext\("(.*?)"\)/g

function Result(msgctxt, msgid){
    this.msgctxt = msgctxt
    this.msgid = msgid
    this.files = {} // fake hastable
}

Result.prototype.addFile = function (file) {
    this.files[file] = null
}

Result.prototype.toString = function(){

    var result = `#: ` + Object.keys(this.files).join("\n#: ") + "\n"

    result += this.msgctxt ?  `msgctxt "${this.msgctxt}"\n` : ""
    result += `msgid "${this.msgid}"\n`
    result += `msgstr ""\n`

    return result
}

function Results(){
    this.data = {}
}

Results.prototype.push = function (file, msgctxt, msgid) {
    const key = `${msgctxt}\u0002${msgid}`

    if(this.data[key]===undefined){
        this.data[key] = new Result(msgctxt, msgid)
    }

    this.data[key].addFile(file)
};

const results = new Results()

function parse(file, data){
    parseTemplate(file, data)
    parseScript(file, data, gettext_template1)
    parseScript(file, data, gettext_template2)
}

function parseScript(file, data, regex){

    while ((msgid = regex.exec(data)) !== null) {
        results.push(file, undefined, msgid[1])
    }

}

function parseTemplate(file, data){
    const template = template_regex.exec(data)

    if(template===null){
        console.log(file, "has no template")
        return
    }

    compiler.compile(template[1], {
        preserveWhitespace: false,
        directives: {
            translate (node, directiveMeta) {
                if(node.children.length != 1){
                    console.log(node.children)
                    throw `In ${file}\nNodes with v-translate directive must contains only one child`
                }

                if(node.children[0].type != NODETYPE_TEXT){                    

                    let msgid = node.children[0].text

                    //trim
                    msgid = msgid.replace(/^[\r\n\s]*/, "")
                    msgid = msgid.replace(/[\r\n\s]*$/, "")
                    results.push(file, undefined, msgid)
                }
            }
        }
    })
}

function walkSync(file_or_dir){
    if (fs.statSync(file_or_dir).isDirectory()) {
        let files = fs.readdirSync(file_or_dir)

        for(let file of files){
            walkSync(file_or_dir + "/" + file);
        }
    }
    else if(file_or_dir.endsWith(".vue")) {
        let data = fs.readFileSync(file_or_dir, 'utf-8')
        parse(file_or_dir, data);
    }
}

function main() {
    walkSync("src")

    let result = []

    for(let key of Object.keys(results.data).sort()){
        result.push(results.data[key].toString())
    }

    fs.writeFileSync("src/translations/po/c2corg_ui-client.pot", result.join("\n"))

    console.log(`Process finished. ${Object.keys(results.data).length} messages extracted`)

}

// If running this module directly then call the main function.
if (require.main === module) {
    main();
}

module.exports = main;
