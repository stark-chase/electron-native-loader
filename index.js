const fs = require("fs");
const path = require("path");
const loaderUtils = require('loader-utils');

// substitution-map file name
const substitutionMapFile = "./ElectronNativeSubstitutionMap.json";

let dependencies = {};

function loadSubstitutionMap() {
    if(fs.existsSync(substitutionMapFile)) {
        dependencies = JSON.parse(fs.readFileSync(substitutionMapFile).toString());
       fs.unlinkSync(substitutionMapFile);
    } else {
        console.log("Warning: File " + substitutionMapFile + " not found.");
    }    
}

function processJavaScriptFile(source, options, moduleDirectory) {
    for(let nodeModule in dependencies) {
        let fileToSearch = nodeModule.replace(".", "\\.");
        let regExpPattern = `require\\(['"]bindings['"]\\)\\(['"]${fileToSearch}['"]\\)`;
        let regExp = new RegExp(regExpPattern, "g");
        // console.log(regExpPattern);
        // process.abort();

        let modulePath = path.resolve(options.outputPath, dependencies[nodeModule]);
        modulePath = path.relative(process.cwd(), modulePath);
        modulePath = path.relative(moduleDirectory, modulePath);
        modulePath = path.posix.normalize(modulePath);
        modulePath = JSON.stringify(modulePath);
        source = source.replace(regExp, `require(${modulePath})`);
    }
    return source;
}

function processNodeBinary(moduleName) {
    let electronModulePath = "";
    if(dependencies[moduleName]) {
        electronModulePath = dependencies[moduleName];
    } else {
        for(let nodeModule in dependencies) {
            if(moduleName.includes(path.basename(dependencies[nodeModule]))) {
                electronModulePath = dependencies[nodeModule];
                break;
            }
        }
    }
    if (electronModulePath[0] !== '.') {
        electronModulePath = './' + electronModulePath
    }   
    return 'module.exports = __non_webpack_require__(' + JSON.stringify(electronModulePath) + ')';
}

loadSubstitutionMap();

module.exports = function(source) {
    let options = loaderUtils.getOptions(this);
    let moduleName = loaderUtils.interpolateName(this, "[name].[ext]", {context: "."});
    let moduleDirectory = loaderUtils.interpolateName(this, "[path]", {context: "."});

    if(moduleName.endsWith(".js")) {
        return processJavaScriptFile(source, options, moduleDirectory);
    } else {
        return processNodeBinary(moduleName);
    }
}