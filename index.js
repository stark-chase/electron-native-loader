const loaderUtils = require('loader-utils');
const fs = require("fs");
const path = require("path");

const substitutionMapFile = "./ElectronNativeSubstitutionMap.json";

let dependencies = {};
if(fs.existsSync(substitutionMapFile)) {
    dependencies = JSON.parse(fs.readFileSync(substitutionMapFile).toString());
   fs.unlinkSync(substitutionMapFile);
} else {
    console.log("Warning: File " + substitutionMapFile + " not found.");
}

module.exports = function(source) {
    let modulePath = loaderUtils.interpolateName(this, "[name].[ext]", {context: "."});
    let moduleDir = loaderUtils.interpolateName(this, "[path]", {context: "."});
    let options = loaderUtils.getOptions(this);
    if(modulePath.endsWith(".js")) {
        for(let keyFile in dependencies) {
            let fileToSearch = keyFile.replace(".", "\\.");
            let regExpPattern = `require\\(['"]bindings['"]\\)\\(['"]${fileToSearch}['"]\\)`;
            // console.log(regExpPattern);
            // process.abort();
            let regExp = new RegExp(regExpPattern, "g");
            let moduleFullPath = path.resolve(options.outputPath, dependencies[keyFile]);
            moduleFullPath = path.relative(process.cwd(), moduleFullPath);
            moduleFullPath = path.relative(moduleDir, moduleFullPath);
            moduleFullPath = path.posix.normalize(moduleFullPath);
            moduleFullPath = JSON.stringify(moduleFullPath);
            source = source.replace(regExp, `require(${moduleFullPath})`);
        }
        return source;
    } else {
        if(dependencies[modulePath])
            modulePath = dependencies[modulePath];
        else {
            for(let dep in dependencies) {
                if(modulePath.includes(path.basename(dependencies[dep]))) {
                    modulePath = dependencies[dep];
                    break;
                }
            }
        }
        if (modulePath[0] !== '.') {
            modulePath = './' + modulePath
        }   
    }
    return 'module.exports = __non_webpack_require__(' + JSON.stringify(modulePath) + ')';
}