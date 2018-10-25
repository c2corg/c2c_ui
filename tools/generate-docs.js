const fs = require('fs');

function processReadme(prefix, parent, name, result){
    let data

    try {
        data = fs.readFileSync(parent + '/' + name + '/README.md', 'utf-8')
        data = data.replace("\r", "").split("\n")[0]
    }
    catch(error) {
        data = " "
    }

    result.push([prefix + name, data])
}

function walkSync(dir, result, prefix=""){

    for(let subDir of fs.readdirSync(dir)){
        let path = dir + "/" + subDir

        if(fs.statSync(path).isDirectory()) {
            processReadme(prefix, dir, subDir, result)
            walkSync(path, result, prefix + "    ");
        }
    }
}

function main() {
    var result = []
    walkSync("src", result)

    data = ["| **directory** | **comment** |\n|---|---|"]
    for(let line of result){
        data.push(`|${line[0].replace(/ /g, "&nbsp;")}|${line[1]}|`)
    }

    fs.writeFileSync("docs/source-structure.md", data.join("\n"))
}

    // If running this module directly then call the main function.
if (require.main === module) {
    main();
}

module.exports = main;
