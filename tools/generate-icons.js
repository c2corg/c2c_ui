const fs = require('fs');
const parser = require('xml2js');

const HEADER = "// Auto-generated file by generate-icons.js\n/* eslint-disable */\n\n"

const getJsTemplate = function(prefix, name, width, height, svgPathData){
    return HEADER + `
export default {
  prefix: '${prefix}',
  iconName: '${name}',
  icon: [
    ${width},
    ${height},
    [],
    "",
    '${svgPathData}'
  ]
}`
}

const getIndexDotJsFileContent = function(names){
    const imports = names.map(name => `import ${name} from "./${name}"`)

    return HEADER + imports.join("\n") + "\n\nexport {\n    " + names.join(",\n    ") + "\n}"
}

function main() {
    const root = "src/assets/font-awesome-custom/"
    for(let subDir of fs.readdirSync(root + "svg")){

        const names = []

        if (!fs.existsSync(root + "js/" + subDir)){
            fs.mkdirSync(root + "js/" + subDir);
        }

        for(let file of fs.readdirSync(root + "svg/" + subDir)){

            if(file.endsWith(".svg")){

                names.push(file.replace(".svg", ""))

                fs.readFile(root + "svg/" + subDir + "/" + file, function(err, data) {
                    parser.parseString(data, function (err, result) {
                        const name = file.replace(".svg", "")

                        if(result && result.svg && result.svg.path){

                            fs.writeFileSync(root + "js/" + subDir + "/" + name + ".js", getJsTemplate(
                                subDir,
                                name,
                                result.svg.$.width,
                                result.svg.$.height,
                                result.svg.path[0].$.d
                            ))
                            console.log('Done', subDir, name);
                        } else {
                            fs.writeFileSync(root + "js/" + subDir + "/" + name + ".js", 'export default {}')
                            console.error('Fail', subDir, name);
                        }

                    });
                });
            }
        }

        fs.writeFileSync(root + "js/" + subDir + "/index.js", getIndexDotJsFileContent(names))
    }
}

    // If running this module directly then call the main function.
if (require.main === module) {
    main();
}

module.exports = main;
