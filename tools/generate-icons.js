const fs = require('fs');
const parser = require('xml2js');

const getJsTemplate = function(prefix, name, width, height, svgPathData){
    return `
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

function main() {
    const root = "src/assets/font-awesome-custom/"
    for(let subDir of fs.readdirSync(root + "svg")){

        for(let file of fs.readdirSync(root + "svg/" + subDir)){

            if (!fs.existsSync(root + "js/" + subDir)){
                fs.mkdirSync(root + "js/" + subDir);
            }
            const names = []

            fs.readFile(root + "svg/" + subDir + "/" + file, function(err, data) {
                parser.parseString(data, function (err, result) {
                    const name = file.replace(".svg", "")
                    fs.writeFileSync(root + "js/" + subDir + "/" + name + ".js", getJsTemplate(
                        subDir,
                        name,
                        result.svg.$.width,
                        result.svg.$.height,
                        result.svg.path[0].$.d
                    ))
                    console.log('Done', subDir, name);
                });
            });
        }
    }
}

    // If running this module directly then call the main function.
if (require.main === module) {
    main();
}

module.exports = main;
